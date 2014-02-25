'use strict';

var cluster = require('cluster');

var numCPUs = require('os').cpus().length,
    clusterStartTime = Date.now(),
    newWorkerEnv = {};


if (cluster.isMaster) {

  // **************************************
  // *** Master spawns worker processes ***
  // **************************************

  newWorkerEnv.clusterStartTime = clusterStartTime;

  for (var i = 0; i < numCPUs; i++) {
    console.log('Starting worker ' + i);
    cluster.fork(newWorkerEnv);
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
    cluster.fork(newWorkerEnv);
  });

  cluster.on('online', function(worker) {
    console.log('Worker ' + worker.process.pid + ' online');
  });




} else {

  // **********************
  // *** Worker process ***
  // **********************

  if (process.env.clusterStartTime) {
    process.clusterStartTime = new Date(parseInt(process.env.clusterStartTime, 10));
  }

  var rtg = require('url').parse(process.env.REDIS_URL || 'redis://:@localhost:6379/0'),
      RedisStore = require('socket.io/lib/stores/redis'),
      redis = require('socket.io/node_modules/redis'),
      wsPub = redis.createClient(rtg.port, rtg.hostname),
      wsSub = redis.createClient(rtg.port, rtg.hostname),
      wsClient = redis.createClient(rtg.port, rtg.hostname),

      app = require('express')(),
      http = require('http'),
      server = http.createServer(app),
      io = require('socket.io').listen(server),

      JWT = require('./util/token'),
      PgBackend = require('./db/PgBackend'),
      User = require('./models/User');


  /* config */
  var SECRET = process.env.SECRET_KEY || 'bb!onz3e2hc1l-192ug40g@ykf^3@e4rtl!t9(i)d7n#oeo^!r';


  /* Redis auth */
  var redisPassword = rtg.auth.split(':')[1];
  wsPub.auth(redisPassword, function(error) { if (error) throw error; });
  wsSub.auth(redisPassword, function(error) { if (error) throw error; });
  wsClient.auth(redisPassword, function(error) { if (error) throw error; });


  // /* handle redis errors */
  wsPub.on('error', function(error) {
    console.error('redis error:', error);
  }).on('connect', function() {
    console.info('redis connected');
  });

  wsSub.on('error', function(error) {
    console.error('redis error:', error);
  }).on('connect', function() {
    console.info('redis connected');
  });

  wsClient.on('error', function(error) {
    console.error('redis error:', error);
  }).on('connect', function() {
    console.info('redis connected');
  });


  /* Serve html page with express */
  app.get('/', function(req, res) {
    res.sendfile(__dirname + '/views/index.html');
  });

  /* Serve html page with express */
  app.get('/2', function(req, res) {
    res.sendfile(__dirname + '/views/index2.html');
  });


  /* Socket.io config for auth */
  io.configure(function() {

    io.set('log level', 1);
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
    io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling']);

    /* Redis store config */
    io.set('store', new RedisStore({
      redisPub: wsPub,
      redisSub: wsSub,
      redisClient: wsClient
    }));

    /* WebSocket Auth */
    io.set('authorization', function(handshakeData, callback) {
      var token = handshakeData.query.jwt,
          jwt = new JWT(SECRET);

      /* make sure token is valid or else kick */
      jwt.getPayload(token).then(function(){
        callback(null, true);
      }).catch(function() {
        callback(null, false);
      });


    });
  });


  /* Connection event listener */
  io.sockets.on('connection', function(socket) {

    /* Respond to subscribe message */
    socket.on('subscribe', function(room) {

      var token = socket.handshake.query.jwt,
          dbUrl = process.env.DATABASE_URL || 'postgres://'+ process.env.USER +':@localhost/boards',
          dbBackend = new PgBackend(dbUrl),
          user = new User(dbBackend),
          jwt = new JWT(SECRET);

      jwt.getPayload(token).then(function(payload) {
        return payload.user_id;
      })
      .then(function(userId) {
        return user.getChannels(userId);
      })
      .then(function(channels) {
        /* Validate room in userChannels */
        if (channels.indexOf(room) > -1) {
          socket.join(room);
          socket.in(room).emit('joinedRoom', room);

        } else {
          socket.leave(room);
          socket.emit('roomAuth', 'Can\'t join room:' + room);
        }
      }).catch(function(error) {
        console.error('-> error getting channels', error);
      });

    });

  });


  /* Start server */
  var port = process.env.PORT || 3000;
  server.listen(port, function() {
    console.info('Listening on port ' + port);
  });

  process.on('SIGINT', function() {
    process.exit();
  });

}
