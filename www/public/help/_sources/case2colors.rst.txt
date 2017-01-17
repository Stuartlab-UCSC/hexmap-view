
How are colors customized and an image downloaded?
==================================================

Objective
---------

View and download an image of breast cancer subtypes.

Skills Covered
--------------

* Changing background color.
* Changing color assignment for a categorical attribute.
* Using zoom in and zoom out controls.
* Exporting map image to a pdf file.

Steps
-----

1. Open Tumor Map
2. Go to the *Edit* menu and click on *White Background*

.. image:: _images/caseColors-1.png
   :width: 450 px

3. Observe that the map background changes to white
4. Click on *Select Attribute* drop down list, type in “brca” then click on *BRCA Subtype*

.. image:: _images/caseColors-2.png
   :width: 450 px

5. Observe that the legend on the right of the map changes to reflect an additional attribute and only BRCA tumors have the colors since only those tumors have the BRCA Subtype annotation

.. image:: _images/caseColors-3.png
   :width: 500 px

6. Observe that the Normal-like tumors are colored white and, therefore, are not visible on the white background. We will adjust the color of those tumors next
7. Go to the *Edit* menu and click on *Colormap*

.. image:: _images/caseColors-4.png
   :width: 450 px

8. A screen for configuring colors of categorical annotations will open. Notice that the Normal category in the BRCA Subtype annotation is configured to be white

.. image:: _images/caseColors-5.png
   :width: 900 px

9. Change this color to #00FFFF or another desired color and press the return or tab key

.. image:: _images/caseColors-6.png
   :width: 900 px

10. Close the Colormap configuration screen
11. Observe that the color of the Normal-like tumors in the legend and map have changed to the newly configured color

.. image:: _images/caseColors-7.png
   :width: 550 px

12. Go to the File menu, then *Download*, then *PDF*

.. image:: _images/caseColors-8.png
   :width: 450 px

13. Click on X to close the popup window (if you wish to not print the legend to the downloaded image, just uncheck the legend checkbox on the right side before closing the popup window)

.. image:: _images/caseColors-9.png
   :width: 400 px

14. Use your browser’s normal print function to *save/print to PDF*