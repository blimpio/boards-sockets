'use strict';

var devConfig = require('../devConfig'),
    PG_URL = process.env.DATABASE_URL || devConfig.PG_URL,
    PgBackend = require('../db/PgBackend'),
    User = require('../models/User');


var RoomAuth = {
  authorize: function(options) {
    return function(room) {
      var self = this,
          dbBackend = new PgBackend(PG_URL),
          user = new User(dbBackend),
          userID = options.decodedToken.user_id;

      user.getChannels(userID)
        .then(function(channels) {
          if (channels.indexOf(room) > -1) {
            self.join(room);
            self.in(room).emit('joinedRoom', room);

          } else {
            self.leave(room);
            self.emit('roomAuth', 'Can\'t join room:' + room);
          }
        })
        .catch(function(error) {
          console.error('-> error getting channels', error);
        });
    };

  }
};


module.exports = RoomAuth;
