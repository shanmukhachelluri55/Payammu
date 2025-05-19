const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your Sequelize config

const RazorpayCredentials = sequelize.define('RazorpayCredentials', {
  store_id: {
    type: DataTypes.INTEGER,  // Changed to INTEGER to store as a number
    primaryKey: true,
  },
  key_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  key_secret: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: 'razorpay_credentials',
  timestamps: false, // Set to true if your table has `createdAt` and `updatedAt`
});

module.exports = RazorpayCredentials;
