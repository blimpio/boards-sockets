'use strict';

var _jwt = require('jwt-simple'),
    RSVP = require('rsvp');

var JWT = function(secret) {
  this.secret = secret;
};

JWT.prototype.getPayload = function(token) {
  var self = this;

  var promise = new RSVP.Promise(function(resolve, reject) {

    try {
      resolve(_jwt.decode(token, self.secret));
    } catch (error) {
      reject(error);
    }

  });

  return promise;

};

module.exports = JWT;
