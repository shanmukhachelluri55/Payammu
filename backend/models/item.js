const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Item extends Model {}

Item.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        bill_number: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        subvariant: { type: DataTypes.STRING, allowNull: true }, 
        price: { type: DataTypes.DECIMAL(10, 2) },
        image: { type: DataTypes.TEXT },
        category: { type: DataTypes.STRING },
        available: { type: DataTypes.BOOLEAN },
        quantity: { type: DataTypes.INTEGER },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    {
        sequelize,
        modelName: 'Item',
        tableName: 'items',
        timestamps: false
    }
);

module.exports = Item;
