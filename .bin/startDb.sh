mv /Users/swat/dev/db/mongo.log /Users/swat/dev/db/mongo.old.log
mongod \
	--bind_ip 127.0.0.1 \
	--port 27017 \
	--dbpath /Users/swat/dev/db \
	&> Users/swat/db/mongo.log &

