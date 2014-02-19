'use strict';

var DatabaseBackend = require('./Backend'),
    pg = require('pg'),
    sql = require('squel'),
    Q = require('q');

/* constructor */
var PgBackend = function(connectUrl) {
  this.connectUrl = connectUrl;
  this.sql.useFlavour('postgres');
};

/* Implement DatabaseBackend interface */
PgBackend.prototype = Object.create(DatabaseBackend);

/* Hook squel to backend */
PgBackend.prototype.sql = sql;

/* connect */
PgBackend.prototype.connect = function() {
  var deferred = Q.defer();

  pg.connect(this.connectUrl, function(error, client, done) {
    if (error) {
      deferred.reject(new Error(error));
    }

    deferred.resolve({client: client, done: done});
  });

  return deferred.promise;
};

/* get */
PgBackend.prototype.get = function(tableName, id) {
  var deferred = Q.defer();

  var query = this.sql.select().from(tableName).where('id = ?', id).toString();
  this.query(query)
    .then(function(result) {
      deferred.resolve(result.rows[0]);
    }, function(error) {
      deferred.reject(new Error(error));
    });

  return deferred.promise;
};

/* query */
PgBackend.prototype.query = function(query) {
  var deferred = Q.defer();

  this.connect()
    .then(function(connection){
      connection.client.query(query, function(error, result) {
        if (error) {
          deferred.reject(new Error(error));
        }

        connection.done();
        deferred.resolve(result);
      });
    });

  return deferred.promise;
};


/* Sample Usage */
// var db = new PgBackend('postgres://gcollazo:@localhost/blimp-backend');
// db.get('users_user', 1)
//   .then(function(reply) {
//     console.log('-->', reply);
//   });

module.exports = PgBackend;
