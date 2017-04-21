Calc Server Requirements
========================

Install python and libraries
----------------------------

**Python**

python v2.7

**Python modules**

 | colormath==2.1.1
 | Flask
 | Flask-Cors
 | numpy==1.10.4
 | pandas==0.17.1
 | requests
 | scikit-learn==0.17.1
 | scipy==0.17.1
 | statsmodels==0.6.1
 | uwsgi

Shortcut::

 pip install colormath numpy==1.10.4 pandas==0.17.1 scikit-learn==0.17.1 \
    scipy==0.17.1 statsmodels==0.6.1 Flask Flask-Cors uwsgi

Note that if you do not have libssl-dev installed, uwsgi will not have the https
options available.
