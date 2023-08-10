const path = require('path');

// Import the models
const User = require('./User');
const PetPhoto = require('./PetPhoto');
const Comment = require('./Comment');

const db = {
  User,
  PetPhoto,
  Comment
};

// Set up the associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
