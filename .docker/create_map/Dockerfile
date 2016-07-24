# Variance filter docker image
#
# 
# Build with: sudo docker build --force-rm --no-cache -t ynewton/varfilter - < 04_21_16_VARFILTER_Dockerfile
# Run with: sudo docker run -v , <IO_folder>:/home/datadir -i -t ynewton/varfilter —in_file /data/input.tab input.tab -filter_level .2 -out_file /data/test.tab
#
# docker build -t quay.io/hexmap_ucsc/hexagram_create_map:1.0 .
# docker run -it -v `pwd`:/home/ubuntu quay.io/hexmap_ucsc/hexagram_create_map:1.0 /bin/bash

# Use ubuntu
#FROM ubuntu:14.04
# Use anaconda docker image:
FROM continuumio/anaconda

MAINTAINER Yulia Newton <ynewton@soe.ucsc.edu>

USER root
RUN apt-get -m update && apt-get install -y python wget unzip && apt-get install -qq vim && apt-get install -qq build-essential

#Below is my attempt at installing anaconda on ubuntu; didn't get it to work successfully yet; if used need to uncomment from ubuntu and comment from anaconda:
#RUN wget --quiet bash http://repo.continuum.io/archive/Anaconda2-4.1.1-Linux-x86_64.sh -O ~/anaconda.sh
#RUN chmod a+x ~/anaconda.sh
#RUN usr/local/bin/bash ~/anaconda.sh -b -p /opt/conda
#ENV PATH /opt/conda/bin:$PATH

#get Tumor Map code:
RUN git clone https://github.com/ucscHexmap/hexagram.git
RUN cp /hexagram/server/statsLayer.py /hexagram/.calc/.
RUN chmod a+x hexagram/.calc/*
RUN chmod a+x hexagram/.bin/*

#install DrL:
RUN wget --no-check-certificate https://bitbucket.org/adam_novak/drl-graph-layout/get/c41341de8058.zip
RUN unzip c41341de8058.zip
RUN chmod a+w /adam_novak-drl-graph-layout-c41341de8058/obj
RUN chmod a+w /adam_novak-drl-graph-layout-c41341de8058/bin
RUN cp adam_novak-drl-graph-layout-c41341de8058/src/Configuration.gnu adam_novak-drl-graph-layout-c41341de8058/src/Configuration.mk
RUN cd adam_novak-drl-graph-layout-c41341de8058/src/
RUN /usr/bin/make -C /adam_novak-drl-graph-layout-c41341de8058/src
RUN chmod a+x adam_novak-drl-graph-layout-c41341de8058/bin/*
#RUN export PATH=./:DRL:$PATH
RUN export PATH=adam_novak-drl-graph-layout-c41341de8058/bin/:$PATH

#copy files and setup permissions:
COPY mRNA_test.tab /usr/local/
RUN chmod a+r /usr/local/mRNA_test.tab

COPY test_attributes.tab /usr/local/
RUN chmod a+r /usr/local/test_attributes.tab

COPY run_map /usr/local/
RUN chmod a+x /usr/local/run_map

RUN chmod -R a+w /usr/local/
RUN mkdir /usr/local/map/
RUN chmod a+rw /usr/local/map/

# switch back to the ubuntu user so this tool (and the files written) are not owned by root
#RUN groupadd -r -g 1000 ubuntu && useradd -r -g ubuntu -u 1000 ubuntu
#USER ubuntu

CMD ["/bin/bash"]
