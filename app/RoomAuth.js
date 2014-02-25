'use strict';

var devConfig = require('../devConfig'),
    PG_URL = process.env.DATABASE_URL || devConfig.PG_URL,
    JWT = require('../lib/token'),
    PgBackend = require('../db/PgBackend'),
    User = require('../models/User');


var RoomAuth = {
  authorize: function(socket, room, token, secret) {

    var jwt = new JWT(secret),
        dbBackend = new PgBackend(PG_URL),
        user = new User(dbBackend);

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

  }
};


module.exports = RoomAuth;
