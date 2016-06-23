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

COPY filter_out_lowest_varying_genes.py /usr/local/bin/
RUN chmod a+x /usr/local/bin/filter_out_lowest_varying_genes.py

# switch back to the ubuntu user so this tool (and the files written) are not owned by root
RUN groupadd -r -g 1000 ubuntu && useradd -r -g ubuntu -u 1000 ubuntu
USER ubuntu

#python2.7 filter_out_lowest_varying_genes.py --in_file input.tab --filter_level .2 --out_file test.tab
CMD ["/bin/bash"]
