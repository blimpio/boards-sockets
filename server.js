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
    var time = parseInt(process.env.clusterStartTime, 10);
    process.clusterStartTime = new Date(time);
  }

  var devConfig = require('./devConfig'),
      REDIS_URL = process.env.REDIS_URL || devConfig.REDIS_URL,
      SECRET = process.env.SECRET_KEY || devConfig.SECRET,

      redisClient = require('./app/RedisClient'),
      redis = new redisClient(REDIS_URL),
      redisStoreClient = redis.createStoreClient(),

      RedisStore = require('socket.io/lib/stores/redis'),

      app = require('express')(),
      http = require('http'),
      server = http.createServer(app),
      io = require('socket.io').listen(server),

      socketioJwt = require('socketio-jwt'),
      RoomAuth = require('./app/RoomAuth');

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
    /* basic config */
    io.set('log level', 1);
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
    io.set('transports', ['websocket', 'xhr-polling', 'jsonp-polling']);

    /* Redis store config */
    io.set('store', new RedisStore(redisStoreClient));

    /* WebSocket Auth */
    io.set('authorization', socketioJwt.authorize({
      secret: SECRET,
      handshake: true
    }));

  });


  /* Connection event listener */
  io.sockets.on('connection', function(socket) {
    console.log(socket.handshake.decoded_token.user_id, 'user_id connected');

    /* Respond to subscribe message */
    socket.on('subscribe', RoomAuth.authorize({
      decodedToken: socket.handshake.decoded_token
    }));

  });


  /* Start server */
  var port = process.env.PORT || devConfig.PORT;
  server.listen(port, function() {
    console.info('Listening on port ' + port);
  });

  process.on('SIGINT', function() {
    process.exit();
  });

}
