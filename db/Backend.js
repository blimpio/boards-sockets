'use strict';

// DatabaseBackend Interface
var DatabaseBackend = {
  connect: function() {},
  get: function(tableName, id) {},
  query: function(query) {}
};

module.exports = DatabaseBackend;
