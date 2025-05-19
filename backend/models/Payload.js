const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Make sure path is correct

const Payload = sequelize.define(
  'Payload',
  {
    payload_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // References the Users table
        key: 'user_id',
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    licence_name: {
      type: DataTypes.STRING(255), // Added licence_name field
      allowNull: true,
    },
  },
  {
    tableName: 'payload',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

module.exports = Payload;
