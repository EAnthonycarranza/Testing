const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');
const User = require('./User');
const PetPhoto = require('./PetPhoto');

class Comment extends Model {}

Comment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            field: 'userId', // This maps the Sequelize field to the actual DB column
            references: {
                model: 'Users',
                key: 'id',
            }
        },
        pet_photo_id: {
            type: DataTypes.INTEGER,
            field: 'petPhotoId', // This maps the Sequelize field to the actual DB column
            references: {
                model: 'pet_photos',
                key: 'id',
            }
        }
    },
    {
        sequelize,
        modelName: 'comment'
    }
);


Comment.associate = (models) => {
    Comment.belongsTo(User, {
      foreignKey: 'user_id'
    });
    Comment.belongsTo(PetPhoto, {
      foreignKey: 'pet_photo_id'
    });
};

module.exports = Comment;
