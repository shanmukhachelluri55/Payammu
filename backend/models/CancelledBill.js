const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CancelledBill = sequelize.define('CancelledBill', {
    billId: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    items: { type: DataTypes.JSONB, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    billed_user: { type: DataTypes.STRING, allowNull: false },
    payload_id: { type: DataTypes.INTEGER,  allowNull: false },
});

module.exports = CancelledBill;
