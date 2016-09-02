exit
python
ls
ls ~
python2.7 ~/filter_out_lowest_varying_genes.py --in_file ~/test.tab --filter_level .2 --out_file ~/test_out.tab
ls ~
less -S ~/test_out.tab 
exit
exit
ls /usr/local/bin/
exit
less -S /usr/local/bin/filter_out_genes_unexpressed_in_most_samples.py 
less -S /usr/local/bin/filter_out_genes_unexpressed_in_most_samples.py 
exit
python /usr/local/bin/filter_out_genes_unexpressed_in_most_samples.py --in_file /usr/local/mRNA_test.tab --proportion_unexpressed 0.8 --out_file /usr/local/output.tab
exit
