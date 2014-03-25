'use strict';


var redis = require('redis'),
    parse = require('url').parse;


var RedisClient = function(connectionURL) {
  var options = this.parseURL(connectionURL);
  this.hostname = options.hostname;
  this.port = options.port;
  this.username = options.username;
  this.password = options.password;
};


RedisClient.prototype.parseURL = function(url) {
  var _url = parse(url),
      auth = _url.auth.split(':');

  return {
    hostname: _url.hostname,
    port: _url.port,
    username: auth[0],
    password: auth[1]
  };
};


RedisClient.prototype.makeClient = function() {
  var r = redis.createClient(this.port, this.hostname);

  r.auth(this.password, function(error) {
    if (error) console.error(error);

    r.on('error', function(error) {
      console.error('redis error: ' + error);
    }).on('connect', function() {
      console.info('redis connect: ' + this.host + ':' + this.port);
    });

    return r;

  });
};


RedisClient.prototype.createStoreClient = function() {
  var store = {
    redisPub: this.makeClient(),
    redisSub: this.makeClient(),
    redisClient: this.makeClient()
  };

  return store;
};

module.exports = RedisClient;

