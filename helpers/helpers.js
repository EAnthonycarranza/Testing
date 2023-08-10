// helpers/helpers.js
module.exports = {
    and: function() {
      return Array.prototype.every.call(arguments, Boolean);
    }
  };
  