const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class User extends Model {}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // If you have any other properties/fields for the User, add them here.
}, {
  sequelize,
  modelName: 'User',
});

User.associate = (models) => {
  User.hasMany(models.PetPhoto, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  });
};

module.exports = User;
