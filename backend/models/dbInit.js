// models/dbInit.js
const sequelize = require('../config/db');
const { Bill, Item, Payment } = require('./associations');

async function initializeDatabase() {
    try {
        // Sync all models with the database
        await sequelize.sync({ force: false });
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
}

module.exports = initializeDatabase;
