'use strict';

var JWT = require('../lib/token');

var ConnectionAuth = {
  authorize: function(secret, handshakeData, callback) {
    var token = handshakeData.query.jwt,
        jwt = new JWT(secret);

    /* make sure token is valid or else kick */
    jwt.getPayload(token).then(function(){
      callback(null, true);
    }).catch(function() {
      callback(null, false);
    });
  }
};


module.exports = ConnectionAuth;
