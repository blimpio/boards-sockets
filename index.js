'use strict';

var RedisStore = require('socket.io/lib/stores/redis'),
    redis = require('socket.io/node_modules/redis'),
    pub = redis.createClient(),
    sub = redis.createClient(),
    client = redis.createClient(),
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
pub.auth(redisPassword, function(error) { if (error) throw error; });
sub.auth(redisPassword, function(error) { if (error) throw error; });
client.auth(redisPassword, function(error) { if (error) throw error; });


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
    redisPub: pub,
    redisSub: sub,
    redisClient: client
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

io.sockets.on('connection', function(socket) {

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

  setTimeout(function(){
    userChannels.forEach(function(room) {
      io.sockets.in(room).emit('message', {room:room, data:{action:'create', type:'board'}});
    });
  }, 1000);

});


var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('Listening on port ' + port);
});
