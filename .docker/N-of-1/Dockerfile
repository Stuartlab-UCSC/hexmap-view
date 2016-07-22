# Variance filter docker image
#
# 
# Build with: sudo docker build --force-rm --no-cache -t ynewton/varfilter - < 04_21_16_VARFILTER_Dockerfile
# Run with: sudo docker run -v , <IO_folder>:/home/datadir -i -t ynewton/varfilter —in_file /data/input.tab input.tab -filter_level .2 -out_file /data/test.tab
#
# docker build -t quay.io/hexmap_ucsc/hexagram_variance_filter:1.0 .
# docker run -it -v `pwd`:/home/ubuntu quay.io/hexmap_ucsc/hexagram_variance_filter:1.0 /bin/bash

# Use ubuntu
FROM ubuntu:14.04
FROM continuumio/anaconda

MAINTAINER Yulia Newton <ynewton@soe.ucsc.edu>

USER root
RUN apt-get -m update && apt-get install -y python wget unzip 

COPY compute_pivot_vs_background.py /usr/local/bin/
RUN chmod a+x /usr/local/bin/compute_pivot_vs_background.py

COPY mRNA_test.tab /usr/local/
RUN chmod a+r /usr/local/mRNA_test.tab

COPY meta.json /usr/local/
RUN chmod a+r /usr/local/meta.json

RUN chmod -R a+w /usr/local/

# switch back to the ubuntu user so this tool (and the files written) are not owned by root
RUN groupadd -r -g 1000 ubuntu && useradd -r -g ubuntu -u 1000 ubuntu
USER ubuntu

#RUN python compute_pivot_vs_background.py --in_pivot temp.json --in_meta meta.json --out_file out.tab --log log.tab --num_jobs 0 --neighborhood_size 6
CMD ["/bin/bash"]
