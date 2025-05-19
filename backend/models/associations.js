// models/associations.js
const Bill = require('./bill');
const Item = require('./item');
const Payment = require('./payment');

// Define relationships (associations) between models
Bill.hasMany(Item, { foreignKey: 'bill_number', sourceKey: 'bill_number', as: 'items' });
Bill.hasMany(Payment, { foreignKey: 'bill_number', sourceKey: 'bill_number', as: 'payments' });

Item.belongsTo(Bill, { foreignKey: 'bill_number', targetKey: 'bill_number', as: 'bill' });
Payment.belongsTo(Bill, { foreignKey: 'bill_number', targetKey: 'bill_number', as: 'bill' });

module.exports = { Bill, Item, Payment };
