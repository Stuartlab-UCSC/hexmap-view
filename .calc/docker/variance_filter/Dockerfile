# Variance filter docker image
#
# 
# Build with: sudo docker build --force-rm --no-cache -t ynewton/varfilter - < 04_21_16_VARFILTER_Dockerfile
# Run with: sudo docker run -v , <IO_folder>:/home/datadir -i -t ynewton/varfilter —in_file /data/input.tab input.tab -filter_level .2 -out_file /data/test.tab

# Use ubuntu
FROM ubuntu:14.04

MAINTAINER Yulia Newton <ynewton@soe.ucsc.edu>

USER root
RUN apt-get -m update && apt-get install -y python wget unzip 

COPY 

WORKDIR /home

# Get the essentials
#RUN apt-get update && install -y \
#	r-base


# get wrapper_scripts
RUN  git clone https://github.com/ynewton/docker_wrappers.git
RUN mkdir /data
WORKDIR /data 

#python2.7 filter_out_lowest_varying_genes.py --in_file input.tab --filter_level .2 --out_file test.tab
ENTRYPOINT ["sh", "/home/docker_wrappers/varfilter_wrapper.sh"]
CMD [""]
