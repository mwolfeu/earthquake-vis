DIRECTION:

My original goals were threefold, first I wanted to try to adhere reasonably to basic retinal variables as I could.  One of my issues in designing these sorts of visualizations is that I typically over-engineer to the detriment of readability.

Secondly, I wanted to try to contextualize the data.  I certainly care less about a quake than I do the human toll.  To that end, I looked for hours for a database that would give you a lat/long->population&density metric.  I found several interesting databases at the UN but in the end, none were granular enough to merit inclusion.

Lastly, I wanted to focus on the difference in the values and make them easily apprehendable. I new this might make some event metrics difficult to select.  My answer to this was to provide many metrics knowing that one (at least) should allow easy access.

The visualization & pallete that most inspired me was the NYT tree graphic.  I wanted to try to visualize in a way that was a bit more engaging and nonstandard.  Not only did the color scheme grab me but I liked the way they showed relative magnitudes in an additive bar by segment width/color.  I knew I could adapt this.

In the end my bars break down like this:
Each has a title and, if relevant, a number.
The title is the name of the metric being measured.
The number is the largest (and probably the most notable) in that sequence.

ISSUES BY METRIC:

Depth: Missing values, negative values (what does this even mean?)

Event Source: I wanted to cleverly combine some data points.  Here, the bar label is the station while the width is the number of stations reporting.  Visually, it might be a confusing combination, especially when all the stations which didn't report get a minimum width anyway.  I get the sense that the metaphor is too strained here and would probably do it differently next time.

Magnitude/Location:  I'm still not sure that uniform widths are good here.  Also, there may not be enough variation in the combination of stations to merit its inclusion.

Farthest Station:  I actually would have no problem with this except all the stations that didn't report distance.

The Info Area: (Bottom Left)
It fades between general info (which I have no issue with) and specific info if an event in the bar is selected.

The specific info is just ok.  There might be too much text there and metrics like "Event Type" might not change enough to be useful.  That said, I found my interpretation text for "Magnitude Data Type" to be effective.

Lastly, is the map.  Unfortunately, none of the internal / external libraries for SVGs actually work.  I wrote my own from scratch.  It is pretty awful code and an obvious visualization but I think it adds an important bit of context to the overall info and I tried to downplay it.

GENERAL ISSUES:

I wanted to build a "Confidence" metric from the various "Error" metrics but after a few hours I never arrived at anything that felt better than gratuitous.

I wanted to include population and popDensity to contextualize the graph but I couldn't find an appropriate source.

I still have a couple graphical glitches.

I made values that were too small/missing purposefully unselectable.  It isn't a great solution but I'm not sure what to do that would be better. 

I did a ton of pre-filtering of the data.  I am not happy with how a lot of this turned out. I.E.: Does no data == 0?  Sometimes it did in my code to ensure bar width minimums. This of course, throws off the truth of the metaphor when a non reporting station has a width of 5 and a reporting station has a REAL width of 10.    
