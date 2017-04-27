
Short List
==========

The Short List is in the upper right of the main window and expands when
hovering over it with your mouse.
Attributes in the Short List are those that can be used for display and other
operations.

Selecting an attribute from the **Select Attributes** list will cause that attribute to
be added at the top of the Short List and its values used to color the
map. Also, if you :doc:`createAttribute` it will be added to the Short List.

Basic Anatomy
-------------

Below is a picture of the Short List containing each of the three attribute data
types: continuous, categorical and binary.

The first entry has an **attribute name** of *Tissue* with its **statistics**
shown below its name.
The statistics display is explained at :doc:`attrInfo`, with a
technical discussion at :doc:`statsNsort`.

Below the statistics is a **bar
graph of a categorial attribute** containing the count of values by category.
To the left of the statistics is a
**move handle** to rearrange entries within the Short List. Moving an attribute does
nothing to the map display and is just a convenience for you to organize entries.

The second entry is an attribute containing a **histogram of a continuous
attribute** with the **range extents** of the values underneath.

The last entry contains a **bar graph of a binary
attribute** where yellow represents values of one.

|shortlistBasic|

.. |shortlistBasic| image:: _images/shortlistBasic.png
   :width: 700 px

Select for Display
------------------

Below is a picture pointing out the controls to select an attribute for coloring
the map.

One or two attributes may be displayed at one time. The orange **display
indicators** show which are currently selected for display.
The black **display selector** buttons on the third entry allow you to select that
attribute for display.
These black controls only show up when hovering over the entry.

The **remove attibute** control allows you to remove this entry from the Short
List. This control only shows up when hovering over the entry.
Any attributes that were placed in the short list by selection from the
Select Attribute list will remain in that list after being removed
from the Short List.
Beware that if you remove an attribute that was generated during your interactive
session it will be lost unless you've saved a bookmark.

|shortlistSelect|

.. |shortlistSelect| image:: _images/shortlistSelect.png
   :width: 700 px

Filter Values
-------------

Below is a picture pointing out the controls to limit the values of attributes
for coloring the map.

The orange **value filter active** indicator shows that the filter for this
attribute is active and limiting the values displayed.
The **filter value** shows which values are currently being
displayed. This is a drop-down menu that allows you to choose another value to
display.
You may create a new binary attribute containing the nodes with this value by
clicking on the **create attribute from filter** button.
This control only shows when hovering over the entry.

The second attribute contains continuous values where the
**filtered out values** are contained within the shaded boxes and indicate those values
that will not be displayed. The low and high ends of the range may be manipulated
by moving the **range filter handles**.

When hovering over the second entry the **create attribute from filter** button
will appear and you may click it to generate a new binary attribute
containing the nodes with values in the range.

|shortlistFilter|

.. |shortlistFilter| image:: _images/shortlistFilter.png
   :width: 700 px

Attributes You Create
---------------------

When you :doc:`createAttribute` it will be added to the Short List with a
lavender background so you can distinguish it from attributes selected from the
**Select Attributes** list. These **dynamic** attributes mostly have the same
properties as the other attributes. One notable difference is that when a
dynamic attribute is removed from the Short List without saving a bookmark,
the attribute is irretrievable.

|shortlistDynamic|

.. |shortlistDynamic| image:: _images/shortlistDynamic.png
   :width: 350 px
