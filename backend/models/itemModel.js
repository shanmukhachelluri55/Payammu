const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/db');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,  // Auto-incrementing ID
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING(200000),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  stockPosition: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  userId: {
    type: DataTypes.INTEGER,  // Assuming userId is an integer (can be a foreign key if needed)
    allowNull: false,
  },
  subVariant: {
    type: DataTypes.STRING(100),
    allowNull: true,
  }
}, {
  tableName: 'Items',  // Set the table name to 'Items'
  timestamps: true,    // Automatically handles created_at and updated_at fields
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name', 'category', 'subVariant', 'userId'],
      unique: true,
      where: {
        subVariant: {
          [Op.ne]: null // Ensures uniqueness only when subVariant is not NULL
        }
      }
    }
  ]
});

module.exports = Item;
