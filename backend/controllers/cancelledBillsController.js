const CancelledBill = require('../models/CancelledBill');
const Bill = require('../models/bill');
const Item = require('../models/item');
const Payment = require('../models/payment');

// Create a cancelled bill
const createCancelledBill = async (req, res) => {
    try {
        const { billId, date, items, paymentMethod, reason, total, userId , username ,Login_id

         } = req.body;

        // First, create the cancelled bill record
        const cancelledBill = await CancelledBill.create({
            billId,
            date,
            items,
            paymentMethod,
            reason,
            total,
            userId,
            payload_id:Login_id,
            billed_user:username
        });

        // Delete associated items from the Item table
        const deletedItems = await Item.destroy({
            where: { bill_number: billId } // Match items associated with the bill
        });

        // Delete associated payments from the Payment table
        const deletedPayments = await Payment.destroy({
            where: { bill_number: billId } // Match payments associated with the bill
        });

        // Delete the original bill from the Bill table
        const deletedBill = await Bill.destroy({
            where: { bill_number: billId } // Match the bill using the billId
        });

        if (deletedBill === 0) {
            return res.status(404).json({ message: 'Original bill not found or could not be deleted.' });
        }

        // Respond with success message
        res.status(201).json({
            message: 'Cancelled bill created and all related data deleted successfully.',
            data: cancelledBill,
        });
    } catch (error) {
        console.error('Error creating cancelled bill:', error);
        res.status(500).json({ error: 'Failed to create cancelled bill and delete associated data.' });
    }
};

// Get all cancelled bills by userId
const getCancelledBillsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const cancelledBills = await CancelledBill.findAll({
            where: { userId },
        });

        if (cancelledBills.length === 0) {
            return res.status(404).json({ message: 'No cancelled bills found for the specified user.' });
        }

        res.status(200).json({
            message: 'Cancelled bills fetched successfully.',
            data: cancelledBills,
        });
    } catch (error) {
        console.error('Error fetching cancelled bills:', error);
        res.status(500).json({ error: 'Failed to fetch cancelled bills.' });
    }
};

module.exports = { createCancelledBill, getCancelledBillsByUserId };
