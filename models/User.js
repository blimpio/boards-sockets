'use strict';

var Model = require('./model'),
    Q = require('q'),
    PgBackend = require('../db/PgBackend'),
    config = require('../config'),
    db = new PgBackend(config.dbUrl);


var User = function() {
  var self = this;
  this.tableName = 'users_user';

  /* set arguments to User properties */
  if (arguments[0]) {
    for (var key in arguments[0]) {
      self[key] = arguments[0][key];
    }
  }
};

/* Implement Model interface */
User.prototype = Object.create(Model);

/* Get a user by id */
User.prototype.get = function(id) {
  var self = this,
      deferred = Q.defer();

  db.get(this.tableName, id)
    .then(function(result) {

      /* Set properties */
      for (var key in result) {
        self[key] = result[key];
      }

      deferred.resolve(self);

    }, function(error) {
      deferred.reject(new Error(error));
    });

  return deferred.promise;
};


/*
 * Gets an array of boards for the provided
 * user id
 */
User.prototype.getBoards = function(id) {
  var deferred = Q.defer();

  var query = db.sql
              .select()
              .field('boards_board.id')
              .field('boards_board.name')
              .field('boards_board.date_created')
              .field('boards_board.date_modified')
              .field('boards_board.is_shared')
              .field('boards_board.thumbnail_sm_path')
              .field('boards_board.thumbnail_md_path')
              .field('boards_board.thumbnail_lg_path')
              .from('boards_boardcollaborator')
              .join('boards_board', null,
                    'boards_boardcollaborator.board_id = boards_board.id')
              .where('boards_boardcollaborator.user_id = ?', id)
              .toString();

  db.query(query)
    .then(function(result) {
      deferred.resolve(result.rows);
    }, function(error) {
      deferred.reject(new Error(error));
    });

  return deferred.promise;
};


/*
 * Gets an array of accounts for the provided
 * user id
 */
User.prototype.getAccounts = function(id) {
  var deferred = Q.defer();

  var query = db.sql
              .select()
              .field('accounts_account.id')
              .field('accounts_account.name')
              .field('accounts_account.date_created')
              .field('accounts_account.date_modified')
              .field('accounts_account.slug')
              .field('accounts_account.image_url')
              .field('accounts_account.allow_signup')
              .field('accounts_accountcollaborator.is_owner')
              .from('accounts_accountcollaborator')
              .join('accounts_account', null,
                    'accounts_accountcollaborator.account_id = accounts_account.id')
              .where('accounts_accountcollaborator.user_id = ?', id)
              .toString();

  db.query(query)
    .then(function(result) {
      deferred.resolve(result.rows);
    }, function(error) {
      deferred.reject(new Error(error));
    });

  return deferred.promise;
};


/*
 * Generates an array of channel names for
 * the give user id
 */
User.prototype.getChannels = function(id) {
  var self = this,
      deferred = Q.defer(),
      channels = [];

  channels.push('u' + id);

  this.getBoards(id)
    .then(function(boards) {
      boards.forEach(function(board) {
        channels.push('b' + board.id);
      });

      return self.getAccounts(id);
    })
    .then(function(accounts) {
      accounts.forEach(function(account) {
        channels.push('a' + account.id);
      });

      deferred.resolve(channels);
    });

  return deferred.promise;
};


/* Sample Usage */
// var u = new User();

// u.getChannels(1)
//   .then(function(channels) {
//     console.log(channels);
//   }, function(error) {
//     console.error(error);
//   });

module.exports = User;
