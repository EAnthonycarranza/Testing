const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const User = require('./User');

class PetPhoto extends Model {}

PetPhoto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pet_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    age: { 
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      location: { 
        type: DataTypes.STRING,
        allowNull: true,
      },
      breed: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'pet_photo',
  }
);

PetPhoto.associate = (models) => {
    PetPhoto.belongsTo(models.User, {
        foreignKey: 'user_id'
    });
    PetPhoto.hasMany(models.Comment, {
        foreignKey: 'pet_photo_id',
        onDelete: 'CASCADE'
    });
};

module.exports = PetPhoto;
