Source Code: Compute Server
---------------------------

The code repository is at:

 https://github.com/ucscHexmap/compute

The most current code is in the dev branch.

This is the server dedicated to serving data and performing compute jobs.
We are in the process of migrating all compute jobs from the view server to this
server.

Directory Structure
^^^^^^^^^^^^^^^^^^^

Below are descriptions of the major directories and files.

**run-production** the start script for the production install

**calc** : computation scripts

**www** : http server

    | **config** : installation-dependent configuration

**standalone** : utility code not directly in the pipeline

**tests** : unit and integration tests for this server as well as input test
data for the view server.
