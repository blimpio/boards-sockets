'use strict';

var RedisStore = require('socket.io/lib/stores/redis'),
    redis = require('socket.io/node_modules/redis'),
    wsPub = redis.createClient(),
    wsSub = redis.createClient(),
    wsClient = redis.createClient(),
    backendSub = redis.createClient(),
    app = require('express')(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    jwt = require('jwt-simple'),
    config = require('./config'),
    User = require('./models/User'),
    userChannels;


/* Redis auth */
var redisPassword = process.env.REDIS_PASSWORD || undefined;
wsPub.auth(redisPassword, function(error) { if (error) throw error; });
wsSub.auth(redisPassword, function(error) { if (error) throw error; });
wsClient.auth(redisPassword, function(error) { if (error) throw error; });
backendSub.auth(redisPassword, function(error) { if (error) throw error; });


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

  /* Redis store config */
  io.set('store', new RedisStore({
    redisPub: wsPub,
    redisSub: wsSub,
    redisClient: wsClient
  }));

  /* WebSocket Auth */
  io.set('authorization', function(handshakeData, callback) {
    var token = handshakeData.query.jwt,
        user = new User(),
        payload;

    /* make sure token is valid or else kick */
    try {
      payload = jwt.decode(token, config.secretKey);
    } catch (exception) {
      console.error(exception);
      callback(null, false);
    }

    /* get the current users channels */
    user.getChannels(payload.user_id)
      .then(function(channels) {
        userChannels = channels;
        console.info('-> userChannels', userChannels);
        callback(null, true);
      })
      .catch(function(error) {
        console.error('-> error getting channels', error);
        callback(null, false);
      });
  });
});


/* Connection event listener */
io.sockets.on('connection', function(socket) {

  /* Backend redis messages */
  backendSub.subscribe('user');
  backendSub.subscribe('account');

  backendSub.on('message', function(channel, message) {
    var msg,
        channelPrefix = channel.substring(0, 1);

    try {
      msg = JSON.parse(message);
    } catch(error) {
      msg = false;
      console.error(error);
    }

    if (msg) {
      var room = channelPrefix + msg.sender_id;
      console.log('channel:', room, msg);

      /* Send paylod to client */
      var eventName = channel + 'Message';
      socket.in(room).emit(eventName, msg);
    }

  });


  /* Respond to subscribe message */
  socket.on('subscribe', function(room) {

    /* Validate room in userChannels */
    if (userChannels && userChannels.indexOf(room) > -1) {
      console.log('joining room:', room);
      socket.join(room);
      socket.in(room).emit('message', 'joined room: ' + room);

    } else {
      socket.emit('roomauthfail',
                  {room: room, message:'user can\'t join room'});
    }

  });

});


/* Start server */
var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('Listening on port ' + port);
});
