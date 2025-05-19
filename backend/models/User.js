const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your database configuration

const User = sequelize.define(
  'User',
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    shop_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subscription: {
      type: DataTypes.STRING(50),
      allowNull: true, // Optional
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true,
    },
    image: {
      type: DataTypes.TEXT, // Changed to TEXT to handle base64 image strings
      allowNull: true,
    },
    licence_name: {
      type: DataTypes.STRING(255), // Added licence_name field
      allowNull: false,
    },
  },
  {
    tableName: 'users', // Ensure the table name is exactly 'users'
    timestamps: false, // If you don't want to track createdAt and updatedAt
  }
);

// Associations
User.associate = (models) => {
  User.hasOne(models.Subscription, { foreignKey: 'user_id' });
  User.hasOne(models.Payload, { foreignKey: 'user_id' });
};

module.exports = User;
