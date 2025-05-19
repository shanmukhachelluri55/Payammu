const { Op } = require('sequelize');
const Bill = require('../models/bill');
const CancelledBill = require('../models/CancelledBill');

const getNextBillNumber = async (userId) => {
    try {
        // Fetch the latest bill from the `Bill` table for the given userId
        const latestActiveBill = await Bill.findOne({
            where: { user_id: userId },  // Filter by userId
            order: [['timestamp', 'DESC']],
            attributes: ['bill_number', 'timestamp'],
        });

        // Fetch the latest bill from the `CancelledBill` table for the given userId
        const latestCancelledBill = await CancelledBill.findOne({
            where: { userId: userId },  // Filter by userId
            order: [['date', 'DESC']],
            attributes: ['billId', 'date'],
        });

        let latestBillNumber = 0;

        if (latestActiveBill && latestCancelledBill) {
            // Compare timestamps to determine the latest bill
            const activeTimestamp = new Date(latestActiveBill.timestamp).getTime();
            const cancelledTimestamp = new Date(latestCancelledBill.date).getTime();

            if (activeTimestamp > cancelledTimestamp) {
                latestBillNumber = latestActiveBill.bill_number;
            } else {
                latestBillNumber = parseInt(latestCancelledBill.billId, 10); // Ensure it's an integer
            }
        } else if (latestActiveBill) {
            latestBillNumber = latestActiveBill.bill_number;
        } else if (latestCancelledBill) {
            latestBillNumber = parseInt(latestCancelledBill.billId, 10);
        }

        // Increment the latest bill number
        return latestBillNumber + 1;
    } catch (error) {
        console.error('Error fetching latest bill number:', error);
        throw new Error('Could not determine the next bill number.');
    }
};

module.exports = getNextBillNumber;
