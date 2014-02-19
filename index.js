'use strict';

var app = require('express')(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    jwt = require('jwt-simple'),
    config = require('./config'),
    User = require('./models/User'),
    userChannels;

/* Serve html page with express */
app.get('/', function(req, res) {
  res.sendfile(__dirname + '/views/index.html');
});


/* Socket.io config for auth */
io.configure(function() {
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

});


server.listen(3000);
