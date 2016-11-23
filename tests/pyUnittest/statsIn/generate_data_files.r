# Initializing the complete matrix
complete_matrix <- 0 

# Creating data for TP53 with rnorm of (20,10,1),(20,1,1),(20,5,1)
print ("Creating data for TP53 with rnorm of (20,10,1),(20,1,1),(20,5,1)")
mat_TP53_1 <- matrix(rnorm(20,10,1),1)
mat_TP53_2 <- matrix(rnorm(20,1,1),1)
mat_TP53_3 <- matrix(rnorm(20,5,1),1)

mat_TP53 <- cbind(mat_TP53_1,mat_TP53_2)
mat_TP53 <- cbind(mat_TP53,mat_TP53_3)

# Finds absolute value of the TP53 values so that there are no negative gene expression values
mat_TP53 <- abs(mat_TP53)

# Creating data for ACTN  with rnorm of (60,5,1)
print ("Creating data for ACTN with rnorm of (60,5,1)")
mat_ACTN <- matrix(rnorm(60,5,1),1)

#Combine ACTN and TP53
complete_matrix <- rbind(mat_TP53,mat_ACTN)

# Creating data for TP63 with rnorm of (20,9,1),(20,2,1),(20,5,1)
print ("Creating data for TP63 with rnorm of (20,9,1),(20,2,1),(20,5,1)")
mat_TP63_1 <- matrix(rnorm(20,9,1),1)
mat_TP63_2 <- matrix(rnorm(20,2,1),1)
mat_TP63_3 <- matrix(rnorm(20,5,1),1)

mat_TP63 <- cbind(mat_TP63_1,mat_TP63_2)
mat_TP63 <- cbind(mat_TP63,mat_TP63_3)

# Combining complete matrix(TP53 and ACTN) with TP63
complete_matrix <- rbind(complete_matrix,mat_TP63)

# Creating data for CDKN2A with rnorm of (60,8,1)
print ("Creating data for CDKN2A with rnorm of (60,8,1)")
mat_CDKN2A <- matrix(rnorm(60,8,1),1)

# Combining complete matrix(TP53, ACTN, and P63) with CDKN2A
complete_matrix <- rbind(complete_matrix,mat_CDKN2A)

# Creating data for RB1 with rnorm(60,6,1)
print ("Creating data for RB1 with rnorm of (60,6,1)")
mat_RB1 <- matrix(rnorm(60,6,1),1)

# Combining complete matrix(TP53, ACTN, P63,and CDKN2A) with RB1
complete_matrix <- rbind(complete_matrix,mat_RB1)

#Creating data for BRCA1 with rnorm(40,5,1),(6,1,1),(14,5,1)
print ("Creating data for BRCA1 with rnorm(40,5,1),(6,1,1),(14,5,1)")
mat_BRCA1_1 <- matrix(rnorm(40,5,1),1)
mat_BRCA1_2 <- matrix(rnorm(6,1,1),1)
mat_BRCA1_3 <- matrix(rnorm(14,5,1),1)

mat_BRCA1 <- cbind(mat_BRCA1_1,mat_BRCA1_2)
mat_BRCA1 <- cbind(mat_BRCA1, mat_BRCA1_3) 

# Combining complete_matrix with BRCA1
complete_matrix <- rbind(complete_matrix,mat_BRCA1)

#Creating data for BRCA2 with rnorm(46,5,1),(9,2,1),(5,5,1)
print ("Creating data for BRCA2 with rnorm(46,5,1),(9,2,1),(5,5,1)")
mat_BRCA2_1 <- matrix(rnorm(46,5,1),1)
mat_BRCA2_2 <- matrix(rnorm(9,2,1),1)
mat_BRCA2_3 <- matrix(rnorm(5,5,1),1)

mat_BRCA2 <- cbind(mat_BRCA2_1,mat_BRCA2_2)
mat_BRCA2 <- cbind(mat_BRCA2, mat_BRCA2_3)

# Combining complete_matrix with BRCA2
complete_matrix <- rbind(complete_matrix,mat_BRCA2)

#Creating data for ATM with rnorm(55,5,1),(5,1,1)
print ("Creating data for ATM with rnorm(55,5,1),(5,1,1)")
mat_ATM_1 <- matrix(rnorm(55,5,1),1)
mat_ATM_2 <- matrix(rnorm(5,1,1),1)

mat_ATM <- cbind(mat_ATM_1,mat_ATM_2)

# Combining complete_matrix with ATM
complete_matrix <- rbind(complete_matrix,mat_ATM)

write.table(complete_matrix, file = "data_set.csv",row.names= FALSE,sep="\t")




