module.exports = {

  getChannels: function(userId) {
    var chanNames = ['a', 'b', 'u'],
        names = [];
    chanNames.forEach(function(name) {
      names.push(name + userId);
    });

    return names;
  }

};
