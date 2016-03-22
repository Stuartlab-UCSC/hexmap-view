BASE=/Users/swat/dev/db
touch $BASE/mongo.log
mv $BASE/mongo.log $BASE/mongo.old.log &&
mongod \
	--bind_ip 127.0.0.1 \
	--port 27017 \
	--dbpath $BASE \
	&> $BASE/mongo.log &

