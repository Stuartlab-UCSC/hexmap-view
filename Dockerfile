#looks at requirments.txt and builds your python environment
FROM python:2.7-onbuild

#set path so scripts can be called easily
ENV PATH="/usr/src/app/www/server/DRL_bin:/usr/src/app/www/server:${PATH}"
#
#opens a shell with -it  
CMD ["/bin/bash"]

