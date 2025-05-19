const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Payment extends Model {}

Payment.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        bill_number: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        method: { type: DataTypes.STRING },
        amount: { type: DataTypes.DECIMAL(10, 2) }
    },
    {
        sequelize,
        modelName: 'Payment',
        tableName: 'payments',
        timestamps: false
    }
);

module.exports = Payment;
