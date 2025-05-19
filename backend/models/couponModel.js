// models/Coupon.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming you have a sequelize instance configured

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, // Using UUIDV4 for default value
    },
    code: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [['percentage', 'fixed']], // Enum validation to match 'percentage' or 'fixed'
        },
    },
    validUntil: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    minBillAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'Coupons',
    timestamps: false, // Disable automatic timestamp fields (createdAt, updatedAt) if not needed
});

module.exports = Coupon;
