
What is the top differentiating attribute for squamous-like bladder cancer?
===========================================================================

Objective
---------
Identify squamous-like bladder cancer samples from the TCGA PanCan-12 mRNA dataset.

Skills Covered
--------------

* Filtering the samples in the map using a short list selection
* Creating a group using polygon selection
* Sorting sample attributes based on their association with a custom group

Steps
-----

1. With the map, **Pancan12/SampleMap**, make sure the **mRNA** layout is selected and only **Tissue** is selected in the Short List.

.. image:: _images/caseTopDiff-1.png
   :width: 750 px

2. In the Short List **Tissue** entry click on the filter button |shortlistFilterButton| and be sure **BLCA** is selected in the drop down menu.

.. |shortlistFilterButton| image:: https://tumormap.ucsc.edu/icons/filter.png
   :width: 20 px

.. image:: _images/caseTopDiff-2.png
   :width: 300 px

3. Observe that only BLCA samples are colored in the map.

.. image:: _images/caseTopDiff-3.png
   :width: 500 px

4. Locate the zoom in/out control in the bottom right of the map and click on the **+** once or twice to zoom in to see all of the BLCA tumors as below.

.. image:: _images/caseTopDiff-4.png
   :width: 500 px

5. Click on the **Select** main menu then click on **by Polygon**.

6. Select the region containing the squamous BLCA samples (those in the LUSC and HNSC region) by clicking to define each vertex of the polygon. Double-click to complete the polygon. Name this group **squamous**.

.. image:: _images/caseTopDiff-5.png
   :width: 500 px

7. The above actually selects all of the samples within the selection region and not just BLCA. That's OK because we are most interested in the region.

8. Click on the **Sort attributes** button on the header as shown below.

.. image:: _images/caseTopDiff-8.png
   :width: 700 px

9. In the window, **Sort Attributes by Associative Statistic**, be sure **Focus attribute** and **Layout independent** are selected as shown below. For **Attribute A** select **squamous**. Click the **Sort** button.

.. image:: _images/caseTopDiff-9.png
   :width: 300 px

10. The message to the right of the **Sort** button will appear as below.

.. image:: _images/caseTopDiff-10.png
   :width: 300 px


11. After a few seconds to a few minutes when the computations complete, the message will change to the below. Observe that one of the top differentiating attributes in the **Select Attribute** list is **GP6_Squamous differentiation/development program**. Click on this entry to display it and see its higher values in the area selected.

.. image:: _images/caseTopDiff-11.png
   :width: 750 px

