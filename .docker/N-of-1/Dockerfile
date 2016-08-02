# Variance filter docker image
#
# 
# Build with: sudo docker build --force-rm --no-cache -t ynewton/varfilter - < 04_21_16_VARFILTER_Dockerfile
# Run with: sudo docker run -v , <IO_folder>:/home/datadir -i -t ynewton/varfilter —in_file /data/input.tab input.tab -filter_level .2 -out_file /data/test.tab
#
# docker build -t quay.io/hexmap_ucsc/n_of_1:1.0 .
# docker run -it -v `pwd`:/home/ubuntu quay.io/hexmap_ucsc/n_of_1:1.0 /bin/bash

# Use ubuntu
#FROM ubuntu:14.04
FROM continuumio/anaconda

MAINTAINER Yulia Newton <ynewton@soe.ucsc.edu>

USER root
RUN apt-get -m update && apt-get install -y python wget unzip && apt-get install -qq vim && apt-get install -qq build-essential


COPY compute_pivot_vs_background2.py /usr/local/bin/
RUN chmod a+x /usr/local/bin/compute_pivot_vs_background2.py

COPY mRNA_background_test.tab /usr/local/
RUN chmod a+r /usr/local/mRNA_background_test.tab

COPY xy_positions.tab /usr/local/
RUN chmod a+r /usr/local/xy_positions.tab

COPY test_overlayNode_request.json /usr/local/
RUN chmod a+r /usr/local/test_overlayNode_request.json

RUN chmod -R a+w /usr/local/

# switch back to the ubuntu user so this tool (and the files written) are not owned by root
#RUN groupadd -r -g 1000 ubuntu && useradd -r -g ubuntu -u 1000 ubuntu
#USER ubuntu

#RUN python ./bin/compute_pivot_vs_background2.py --in_pivot test_overlayNode_request.json --in_background mRNA_background_test.tab --in_coordinates xy_positions.tab --metric correlation --out_file test.out.tab --log log.tab --num_jobs 0 --neighborhood_size 6
CMD ["/bin/bash"]
