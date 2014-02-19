'use strict';

var DatabaseBackend = require('./Backend'),
    pg = require('pg'),
    sql = require('squel'),
    RSVP = require('rsvp');

/* Catch all pg errors */
pg.on('error', function(error) {
  console.error('PgBackend postgres error:', error);
});

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
  var self = this;
  var promise = new RSVP.Promise(function(resolve, reject) {

    pg.connect(self.connectUrl, function(error, client, done) {
      if (error) {
        reject(error);
      } else {
        resolve({client: client, done: done});
      }
    });

  });

  return promise;
};


/* query */
PgBackend.prototype.query = function(query) {
  var self = this;
  var promise = new RSVP.Promise(function(resolve, reject) {

    self.connect()
      .then(function(connection){
        connection.client.query(query, function(error, result) {
          if (error) {
            reject(error);
          } else {
            resolve(result);
            connection.done();
          }
        });
      }, function(error) {
        reject(error);
      });

  });

  return promise;
};


/* get */
PgBackend.prototype.get = function(tableName, id) {
  var self = this;
  var promise = new RSVP.Promise(function(resolve, reject) {

    var query = sql.select()
                   .from(tableName)
                   .where('id = ?', id).toString();

    self.query(query)
      .then(function(result) {
        resolve(result.rows[0]);
      }, function(error) {
        reject(error);
      });

  });

  return promise;
};

/* Sample Usage */
// var db = new PgBackend('postgres://gcollazo:@localhost/blimp-backend');
// db.get('users_user', 1)
//   .then(function(reply) {
//     console.log('-->', reply);
//   });

module.exports = PgBackend;
