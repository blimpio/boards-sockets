'use strict';

var redis = require('redis'),
    parse = require('url').parse;

var RedisClient = function(connectionURL) {
  this.connectionURL = connectionURL;
  this.options = this.parseURL(connectionURL);
};


RedisClient.prototype.parseURL = function(url) {
  var _url = parse(url);
  this.port = _url.port;
  this.host = _url.hostname;
  this.password = _url.auth.split(':')[1];
};


RedisClient.prototype.createClient = function() {
  var r = redis.createClient(this.port, this.host);
  r.auth(this.password, function(error) { if (error) throw error; });

  r.on('error', function(error) {
    console.error('redis error: ' + error);
  }).on('connect', function() {
    console.info('redis connect: ' + this.host + ':' + this.port);
  });

  return r;
};


RedisClient.prototype.createStoreClient = function() {
  var store = {
    redisPub: this.createClient(),
    redisSub: this.createClient(),
    redisClient: this.createClient()
  };

  return store;
};

module.exports = RedisClient;
