// define a global variable to hold our USGS data
var table
var tName = "Monthly"
var tHour;
var tDay;
var tWeek;
var tMonth;
var svgXML;

function preload() {
  var localData = true;
  
  if (localData) {
    // load data from either a local copy of one of the USGS CSVs or directly:
    tHour = loadTable("assets/significant_hour.csv", "csv", "header");
    tDay = loadTable("assets/significant_day.csv", "csv", "header");
    tWeek = loadTable("assets/significant_week.csv", "csv", "header");
    tMonth = loadTable("assets/significant_month.csv", "csv", "header");  
  } else {
    // or (while you're designing) from the feed itself:
    tHour =  loadTable("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.csv", "csv", "header");
    tDay =   loadTable("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.csv", "csv", "header");
    tWeek =  loadTable("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.csv", "csv", "header");
    tMonth = loadTable("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.csv", "csv", "header");  
  }
  
  table = tMonth;
  
  svgXML = loadXML("worldLow.svg");

}

/* TODO
DONE: fix multibar
SVG BROKEN: add map

bars
TODO: Bounding Bar?
DONE: fix negative numbers
DONE: fix 0s
DONE: country 2 first chars of ID
DONE: stations sensed by number (net)(nst)
NODATA: population
NODATA: density
DONE: interpretation for magtype (implies distance)
NODATA: station real name: https://earthquake.usgs.gov/monitoring/operations/network.php
Researched and can't understand: rms = fit of data

DONE: smaller than x pixels == unselectable
write values after boxes
DONE: somesortamem loss
DONE: fade specific/generic text
DONE: combine mag/type
DONE: source selector
DONE: time selector
DONE: noinfo msg

DONE: add legend
DONE: add text area
DONE: add timescale
*/

gWidth = 1000;
height = 0;
transparent = 0;

barWidth = gWidth;
barHeight = 30;
barSpacer = 50;
barBuf = 10;
barX = 100;
barY = 80;
textHeight = barHeight / 2;
bColors = [];
bCurve = 5;
grey = 200

bMax = [];  // maximums for each bar

isEvent = false;
eventX = eventY = 0;
pcentView = 100;

// our data
//labels = [];
values = [];

/*

// takes dict of key/val pairs and bars em
dict.push({
    key:   "keyName",
    value: "the value"
});
var dict = {};
dict.key1 = "value1";
dict.key2 = "value2";
*/

// sum vals of array for .reduce()
function sum(total, num) {
    //if (num.length == undefined) {  // No tag
      return total + num;
    /* } else { // Has tag
      if (total.length == undefined)
        return abs(total) + abs(num[1]);
      else
        return abs(total[1]) + abs(num[1]);
    }*/
}

// stackexchange collide alg
function mouseCollide (pointX, pointY, x, y, xW, yW) {
  if (pointX >= x &&       // right of the left edge AND
    pointX <= x + xW &&    // left of the right edge AND
    pointY >= y &&         // below the top AND
    pointY <= y + yW) {    // above the bottom
      return true;
  }
  return false;
};

c = 0; // Unbelievable. (color object)

// Alpha change on existing color. Really hacky.
function setAlpha(myC, a) {
  r = red(myC);
  g = green(myC);
  b = blue(myC);
  
  return c(r,g,b,a);
}

// P5JS BUG: translate/rotate does not work for mouseX/Y!
// gotta provide manual bounding boxes!
function drawMenu(vals, bboxes, bX, bY, r, c) {
    
  push();
  angleMode(DEGREES);
  translate(bX, bY);
  rotate(r);
  
    var curY = 0;
    var curX = 0;
    
    for (var xidx = 0; xidx < vals.length; xidx++, curX+=curWidth) {

      var c = bColors[(xidx+14)%bColors.length];
      stroke(c);
      fill(c);
      
      var lCurve = 0;
      var rCurve = 0;
     
      if (xidx == 0)
        lCurve = bCurve;
        
      if (xidx == vals.length - 1)
        rCurve = bCurve;
          
      var curWidth = 100;
      
      if (mouseCollide (mouseX, mouseY, bboxes[xidx][0], bboxes[xidx][1], bboxes[xidx][2], bboxes[xidx][3])) {
        // println(xidx);
        tabArr = [tHour, tDay, tWeek, tMonth];
        if (table != tabArr[xidx]) {
          table = tabArr[xidx];
          tName = vals[xidx];
          pcentView = 0;
        };
      }       
      
      rect(curX, curY, curWidth, barHeight, lCurve, rCurve, rCurve, lCurve);
        
      textAlign(CENTER);
      stroke(grey, 120);
      fill(grey, 120);      
      text(vals[xidx], curX + curWidth/2, curY + ((barHeight + barBuf)/2));
    }
  pop(); 
   
  for (var xidx = 0; false && xidx < vals.length; xidx++) { // debug
    stroke(111);
    noFill();
    rect(bboxes[xidx][0], bboxes[xidx][1], bboxes[xidx][2], bboxes[xidx][3]);
  }

}

// Draw info in a variety of ways adapted to bar format
// vals     : Actual data
// dispVals : Data in display format
// altVals  : Alternative values if data missing, etc
function drawBars(title, vals, dispVals, altVals) {
  
  if (table.rows.length == 0) {
    a = pcentView<100?pcentView:120;      
    stroke(grey, a);
    fill(grey, a);
    text("No Data For This Period.", barX, barY + 50);
    return;
  }
  
  for (var yidx=0; yidx < vals.length; yidx++) {
    
    var curY = barY + (barHeight + barSpacer)*yidx;
    var curX = barX;
    
    var bUnit = (1.0 * barWidth) / vals[yidx].reduce(sum);  // get base fraction of pixels   
      
    push();  // Bounding Bar
    stroke(grey);
    strokeWeight(3.0);
    noFill();
    //rect(curX - 5, curY - 5, barWidth + barBuf, barHeight + barBuf, bCurve, bCurve, bCurve, bCurve);
    pop()
    
    push()
    for (var xidx = 0; xidx < vals[yidx].length; xidx++, curX+=curWidth) {
      var curTag = 0;
      
      var c = bColors[xidx%bColors.length];
      stroke(c);
      fill(c);
      
      var lCurve = 0;
      var rCurve = 0;
     
      if (xidx == 0)
        lCurve = bCurve;
        
      if (xidx == vals[yidx].length - 1)
        rCurve = bCurve;
      
      if (pcentView < 100 && eventX == xidx && eventY != yidx) {
        lCurve = map(pcentView, 100, 0, 0, bCurve);
        rCurve = map(pcentView, 100, 0, 0, bCurve);
      }
      
      if (pcentView < 100 && eventX != xidx && eventY != yidx) {
        var a = map(pcentView, 0, 100, 0, 255);
        stroke(setAlpha(c, a));  // stupid way to change alpha
        fill(setAlpha(c, a));  
      }      
     
      /*
      if (isEvent && eventX == xidx) { // && eventY == yidx) {
        lCurve = bCurve;
        rCurve = bCurve;
      }*/
      
      // if (vals[yidx][xidx].length == undefined) {  // No tag
        var curVal = vals[yidx][xidx];
      //} else { // Has tag
      //  var curTag = vals[yidx][0][xidx];
      //  var curVal = vals[yidx][1][xidx];
      if (dispVals[yidx].length) {
        var curTag = dispVals[yidx][xidx];
      }
      //}
          
      var curWidth = curVal*bUnit;
      
      // check collisons on boxes bigger than X
      if (curWidth > 3 && mouseCollide (mouseX, mouseY, curX, curY, curWidth, barHeight)) {
        isEvent = true;
        eventX = xidx;
        eventY = yidx;
      }       
      
      rect(curX, curY, curWidth, barHeight, lCurve, rCurve, rCurve, lCurve);
        
      textAlign(CENTER);
      var a = xidx==eventX||yidx==eventY?120:pcentView;
      stroke(grey, a);
      fill(grey, a);      
      if (curTag) { // if a tag exists, print it
        text(curTag, curX + curWidth/2, curY + ((barHeight + barBuf)/2));
      } else {
        a = pcentView<100 && eventX==xidx?120-pcentView:0;      
        stroke(grey, a);
        fill(grey, a);
        if (altVals[yidx].length)
          text(altVals[yidx][xidx], curX + curWidth/2, curY + ((barHeight + barBuf)/2));
        else
          text(vals[yidx][xidx], curX + curWidth/2, curY + ((barHeight + barBuf)/2));
      }
         
      pop();
    }
    
    //textFont("Helvetica", textHeight); // BUG: Why is AA so smudgy?
    textSize(textHeight);
    textAlign(LEFT);
    stroke(grey);
    fill(grey);
    // hack. find out how to intelligently deal w data
    if (yidx == 3) bMax[yidx] = "";
    if (yidx == 2 && tName == "Weekly") bMax[yidx] = "NA";
    //if (Math.min.apply(null, dispVals[yidx]) == Math.max.apply(null, dispVals[yidx])) bMax[yidx] = "";
    if (title.length)
      text(title[yidx] + ": " + bMax[yidx], barX, curY - 10);
      
  }
  pop();
}

magTypeXlate = {
 "md":"Clipped Shaking Duration",
 "ml":"Richter",
 "mb_lg":"Lg Surface Waves",
 "mlg":"Lg Surface Waves",
 "mb":"Short P Body Waves",
 "ms":"Rayleigh Surface Wave",
 "ms_20":"Rayleigh Surface Wave",
 "mw":"Generic Unknown",
 "mwb":"Long-Perioud, P & SH Waves",
 "mwc":"Mid/Long Period & Surface Waves",
 "mwr":"Regional Complete Waveforms",
 "mww":"W-phase Inversion",
 "mi":"Broadband/P Wave",
 "mwp":"Broadband/P Wave",
 "me":"Integrated Digital Waveforms"
}

// in generic show:
// Legend
// Type: weekly, monthly, etc
// tot events
var info;
var selText;
var genText;
var info;

function updateGen() {
  push();
  genText.background(0);
  
  genText.textSize(textHeight + 4);
  genText.textAlign(LEFT);
  genText.stroke(grey, pcentView);
  genText.fill(grey, pcentView);

  genText.text(	
    "\nBar Format: " +
    "\n  Metric Type (Width Unit): Largest Value (Optional)" +
    "\n\nData Source: " + tName + 
    "\nTotal Events: " + table.rows.length 
   , 0, 0);
  pop();}

function updateSel() {
  push();
  selText.background(0);
  
  selText.textSize(textHeight + 4);
  selText.textAlign(LEFT);
  selText.stroke(grey, 100-pcentView);
  selText.fill(grey, 100-pcentView);
  
  var nst = table.getColumn("nst")[eventX];
  nst = nst==""?"NA":nst;

  d = new Date(table.getColumn("time")[eventX]); // parse date
  
  selText.text(	
    "\nLocal Event Time: " + d.toLocaleString() +
    "\nEvent Name: " + table.getColumn("id")[eventX] +
    "\nEvent Type: " + table.getColumn("type")[eventX] +
    "\nLocation: " + table.getColumn("place")[eventX] + 
    "\nMagnitude Data Type: " + magTypeXlate[table.getColumn("magType")[eventX]] +
    "\nNumber of Stations Reporting: " + nst +
    "\nStatus: " + table.getColumn("status")[eventX], 0, 0);
  pop();
}

function textArea() {
  if (isEvent) {
    updateSel();
    info = selText;
  } else {
    updateGen();
    info = genText;
  }
}

var eventDiameter = 20;
var mapMultiplier = 5;
var wMap; // world boarders
var eMap; // quake map

// If no libs work, I will parse my own damn SVG from the XML.
function initWorldMap() {
  wMap.background(0);  
  
  for (var cidx=0; cidx < svgXML.getChild("g").children.length; cidx++) {
    
    var coords = svgXML.getChild("g").children[cidx].attributes.d.split(/,|z|Z|h|v|V|l|L|m|M/); // x y coords
    coords = coords.filter(function(value) { return value != '' });
    var cmds = svgXML.getChild("g").children[cidx].attributes.d.replace(/[0-9X,.\-]/g, '').slice(0, -1); // rid of z
    
    wMap.push()
    wMap.strokeWeight(3);
    wMap.stroke(100,111,100);
    wMap.noFill();
    //wMap.fill(255, 0, 0);
    wMap.beginShape();
    var px = 0;
    var py = 0;
    var x = 0;
    var y = 0;
    var cOffset = 0;
    var xScale = 1.71;
    var yScale = 1.3;
    wMap.translate(80,0);
    for (var idx=0; idx < cmds.length; idx++) {
      px = x;
      py = y;
      x = parseFloat(coords[idx*2-cOffset]) * xScale;
      y = parseFloat(coords[idx*2+1-cOffset]) * yScale;
      
      wMap.push();
      switch (cmds[idx]) {
        case 'z':
          wMap.endShape(CLOSE);
          wMap.beginShape();
          cOffset+=2;
          break;
          
        case 'V':
          y = x;
          x = px;
          cOffset++;
          wMap.vertex(x, y);
          break;       
        case 'v':
          y = py+x;
          x = px;
          cOffset++;
          wMap.vertex(x, y);
          break;
        case 'H':
          y = py;
          cOffset++;
          wMap.vertex(x, y);
          break;       
        case 'h':
          y = py;
          x = px+x;
          cOffset++;
          wMap.vertex(x, y);
          break;  
   
        case "m":
          x = px+x;
          y = py+y;
          //wMap.endShape();
          wMap.translate(x, y);
          //wMap.beginShape();
          break;
        case "M":
          //wMap.endShape();
          wMap.translate(x, y);
          //wMap.beginShape();
          break;
        case "l":
          x = px+x;
          y = py+y;
          wMap.vertex(x, y);
          break;     
        case "L":
          wMap.vertex(x, y);
          break;
        default:
          println("Unhandled path cmd: " + cmds[idx]);
      }
      wMap.pop();
    }
    wMap.endShape(CLOSE);
    wMap.pop();
  }
}

function updateMap () {
  
  eMap.image(wMap, 0, 0);
  
  if (! table.rows.length)
    return;
 
  eMap.push();  
  eMap.translate(eMap.width/2, eMap.height/2);
  eMap.stroke (200,255,0,100);
  eMap.fill (210,255,0,100);
  
  eMap.translate(0,170);
  for (var xidx = 0; xidx < table.rows.length; xidx++) {
    eMap.ellipse(parseInt(table.getColumn("longitude")[xidx]) * mapMultiplier, -1 * parseInt(table.getColumn("latitude")[xidx]) * mapMultiplier, eventDiameter, eventDiameter);
  }
  if (isEvent) {
    eMap.stroke (200,0,0,100);
    eMap.fill (220,0,0,180);
    eMap.ellipse(parseInt(table.getColumn("longitude")[eventX]) * mapMultiplier, -1 * parseInt(table.getColumn("latitude")[eventX]) * mapMultiplier, eventDiameter*2, eventDiameter*2);
  }
  eMap.pop();
}

function setup() {
  bColors = [color("#005548"), color("#7D3051"), color("#2F1F26"), color("#262E35"), color("#783D28"), color("#49000D"), color("#6F6473"), color("#86414F"), color("#357157"), color("#00617E"), color("#7A6333"), color("#77242A"), color("#3E3E24"), color("#7E7E36"), color("#445B1C"), color("#3F342F"), color("#783D28"), color("#7A6333")];

  c = color; // Really?!?
  
  gWidth = windowWidth; // set global width
  createCanvas(windowWidth, windowHeight);
  frameRate(25);
  // img = loadImage('a.svg');  // P5JS BUG: CLIPPING ISSUE CAN'T DEBUG
  
  selText = createGraphics(500, 300);
  genText = createGraphics(500, 300);
  wMap = createGraphics(360 * mapMultiplier, 180 * mapMultiplier);
  eMap = createGraphics(360 * mapMultiplier, 180 * mapMultiplier);
  
  initWorldMap();
  info = genText;
}

// deal intelligently with missing or nonstandard data
function scrub(val) {
  if (typeof(val) == "string") {
    val = val==""?"NA":val;
    val = val=="0"?"NA":val;
  }
  if (typeof(val) == "number") {
    val = val==0?0.05:val;
    val = val!=abs(val)?abs(val):val;
  } 
  return(val);
}

// set val to default 
function one(val) {
  return(1);
}

// make zeros high enough not to effect calculation
function zeroToOneK(val) {
  return(val<1?1000:val);
}

// set val to cap country code
function ccc(val) {
  return(val.substring(0, 2).toUpperCase());
}

halfLow = 0;
// set the min to half of the lowest val.
// Strategy to deal sanely with non-existing data
function minHalfLow(val) {
  return(val<1?halfLow:val);
}

function degToKm(val) {
  if (val == "NA")
    return(val);
  return(Math.round(val*111.2)); // from website
}

dispVals = [];
altVals = [];

function update() {
  barWidth = gWidth - 200;
  bMax = new Array(values.length).fill(0);
  
  // if event is active, change the percent of other bars we view
  if (!isEvent && pcentView != 100) {
    pcentView+=4;
    if (pcentView > 100) pcentView = 100;
  }
  
  if (isEvent) {
    pcentView-=4;
    if (pcentView < 0) pcentView = 0;
  } 
  
  textArea();
  updateMap();

  if (table.rows.length == 0) {
   isEvent = false;
   return;
  }
  
  values = [];
  
  values.push(table.getColumn("mag").map(Number));
  dispVals.push([]);
  altVals.push([]);
  
  values.push(table.getColumn("depth").map(Number).map(scrub));
  dispVals.push([]);
  altVals.push(table.getColumn("depth").map(scrub));
  
  var numStations = table.getColumn("nst").map(Number).map(scrub)
  var nsFiltered = numStations.map(zeroToOneK);
  var low = nsFiltered.reduce(function(a, b, i, arr) {return Math.min(a,b)});
  halfLow = low/2;
  
  values.push(numStations.map(minHalfLow));
  dispVals.push(table.getColumn("net").map(scrub).map(ccc));
  altVals.push([]); 
  
  magLocSrc = [];
  m = table.getColumn("magSource").map(scrub).map(ccc);
  l = table.getColumn("locationSource").map(scrub).map(ccc);
  for (var idx=0; idx < m.length; idx++)
    magLocSrc[idx] = m[idx] + "/" + l[idx];
    
  values.push(table.getColumn("magSource").map(one));
  dispVals.push(magLocSrc);
  altVals.push([]);
  
  values.push(table.getColumn("dmin").map(Number).map(scrub).map(degToKm)); // can't handle 0
  dispVals.push([]);
  altVals.push(table.getColumn("dmin").map(scrub).map(degToKm));
  
  labels = [];
  labels.push("Magnitude (Richter)");
  labels.push("Depth (km)");
  labels.push("Event Source (#Stations)");
  labels.push("Magnitude / Location Source (Uniform)")
  labels.push("Farthest Station (km)");

  // println(eventX + " " + eventY + " " + pcentView + " " + isEvent);
  
  for (var yidx = 0; yidx < values.length; yidx++)
    for (var xidx = 0; xidx < values[yidx].length; xidx++) {
      if (values[yidx][xidx].length == undefined) {  // No tag
        if (bMax[yidx] < values[yidx][xidx]) bMax[yidx] = values[yidx][xidx];
      } else { // Has tag
        if (bMax[yidx] < values[yidx][1][xidx]) bMax[yidx] = values[yidx][1][xidx];
      }
    
      if (xidx != eventX && yidx != eventY) {       
        if (values[yidx][xidx].length == undefined) {  // No tag
          values[yidx][xidx] = map(pcentView, 0, 100, 0, values[yidx][xidx]);
        } else { // Has tag
          values[yidx][1][xidx] = map(pcentView, 0, 100, 0, values[yidx][1][xidx]);
        }
      }
    }
   isEvent = false;
   
}

function draw() {
  update();

  background(0);
  menu = ["Hourly", "Daily", "Weekly", "Monthly"];
  bboxes = [[35, 350, barHeight, 100], [35, 250, barHeight, 98], [35, 150, barHeight, 98], [35, 50, barHeight, 98]]
  drawMenu(menu, bboxes, 35, 450, -90, bColors);
  
  drawBars(labels, values, dispVals, altVals);
  
  stroke(111);
  fill(111);
  
  //  imageMode(CENTER) 

  image(eMap, gWidth - 700, 470, 600, 300);
  imageMode(CORNER);
  image(info, barX, 500);
}

function windowResized() {
  gWidth = windowWidth; // set global width
  if (gWidth > 1400) gWidth = 1400;
  resizeCanvas(windowWidth, windowHeight);
}
