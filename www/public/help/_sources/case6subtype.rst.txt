
Which genomic events distinguish one subtype of cancer from another?
____________________________________________________________________

Objective
---------

Identify genomic events that distinguish one subtype of cancer (e.g. basal
breast cancer) from another (e.g. luminal breast cancer).

Skills Covered
--------------

* Creating a new group from an existing categorical (multi-valued) attribute.
* Using set operations to combine existing groups.
* Running statistical test to order attributes based on their differential
  presence/absence in one group versus another.

Steps
-----

1. With the map, **Pancan12/SampleMap**, make sure the **mRNA** layout is
   selected and only **Tissue** is selected in the Short List. Observe that
   breast tumors are in blue on the bottom right of the map.

.. image:: _images/caseSubtype-1.png
   :width: 750 px

2. In **Select Attribute** type in **brca** and click on **BRCA Subtype**.
   Observe that the breast tumors are colored by the molecular subtypes.

.. image:: _images/caseSubtype-2.png
   :width: 750 px

3. In the Short List **BRCA Subtype** entry click on the filter button
   |shortlistFilterButton| and select **Basal** in the drop down menu. Then
   click the create attribute button |shortlistCreateAttr|. Name this attribute
   **Basal_BRCA**.

.. image:: _images/caseSubtype-3.png
   :width: 300 px

4. Select **BRCA Subtype** for display in the Short List by clicking on the
   **display selector** |primaryButton|. Create another attribute like you did
   above except select **LumA** and save it as **LumA_BRCA**.

5. Create one more attribute like above except select **LumB** and save it as
   **LumB_BRCA**.

6. Click on the **Set Operation** button in the map header.

.. image:: _images/caseSubtype-4.png
   :width: 700 px

7.  In the window, **Perform Set Operation**, select the values as shown in the
    picture below to join the two luminal subtypes. Click on
    **Compute Set Operation** and name this **Lum_BRCA**.

.. image:: _images/caseSubtype-5.png
   :width: 300 px

8. Click on the **Sort Attributes** button in the map header.

.. image:: _images/caseSubtype-6.png
   :width: 700 px

9. In the window, **Sort Attributes by Associative Statistics**, select the
   values as shown below then click on the **Sort** button.

.. image:: _images/caseSubtype-7.png
   :width: 350 px

10. The message to the right of the **Sort** button will appear as below.

.. image:: _images/caseTopDiff-10.png
   :width: 350 px

11. After a few seconds to a few minutes when the computations complete, the
    sort message will change to the below. Observe that the top differentiating
    attributes in the **Select Attribute** list are **GP7_Basal gene program**
    and **GP7_Estrogen gene program**.

.. image:: _images/caseSubtype-8.png
   :width: 700 px


.. |shortlistFilterButton| image:: https://tumormap.ucsc.edu/icons/filter.png
   :width: 20 px

.. |shortlistCreateAttr| image:: https://tumormap.ucsc.edu/icons/file-new.png
   :width: 20 px

.. |primaryButton| image:: https://tumormap.ucsc.edu/icons/primary.png
   :width: 20 px

