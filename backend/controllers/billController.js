const Bill = require('../models/bill');
const Item = require('../models/item');
const Payment = require('../models/payment');
const ItemModel = require('../models/itemModel');
const sequelize = require('../config/db'); // Ensure sequelize is properly imported

// Function to create a bill
async function createBill(req, res) {
    const { 
        billNumber, 
        items, 
        subtotal, 
        gst, 
        gstRate, 
        serviceCharge, 
        serviceChargeAmount, 
        total, 
        payments, 
        userID, 
        Billed_user, 
        Payload_id 
    } = req.body;

    console.log(serviceCharge, serviceChargeAmount);

    const transaction = await sequelize.transaction(); // Start a transaction
    try {
        // Create Bill
        const bill = await Bill.create({
            bill_number: billNumber,
            user_id: userID,
            subtotal,
            gst,
            gst_rate: gstRate, 
            total,
            billed_user: Billed_user,
            payload_id: Payload_id,
            servicecharge: serviceCharge,
            servicechargeamount: serviceChargeAmount
        }, { transaction });

        console.log(bill);

        // Add Items and Update Stock Position
        const stockUpdates = [];
        for (let item of items) {
            // Create bill item
            await Item.create({
                bill_number: bill.bill_number,
                user_id: userID,
                name: item.name,
                price: item.price,
                image: item.image,
                category: item.category,
                available: item.available,
                quantity: item.quantity,
                subvariant: item.subVariant,
            }, { transaction });

            // Update stock position for the specific variant
            const itemRecord = await ItemModel.findOne({ 
                where: { 
                    name: item.name, 
                    userId: userID,
                    subVariant: item.subVariant || null // Match subVariant (or NULL if none)
                }
            });

            if (!itemRecord) {
                throw new Error(`Item "${item.name}" with variant "${item.subVariant || 'None'}" not found for user ID ${userID}`);
            }

            const newStockPosition = itemRecord.stockPosition - item.quantity;

            if (newStockPosition < 0) {
                throw new Error(`Insufficient stock for item "${item.name}" (${item.subVariant || 'No Variant'}). Available: ${itemRecord.stockPosition}, Requested: ${item.quantity}`);
            }

            await itemRecord.update({ stockPosition: newStockPosition }, { transaction });
            stockUpdates.push({ 
                itemName: item.name, 
                subVariant: item.subVariant || 'None',
                newStockPosition 
            });
        }

        // Add Payments
        for (let payment of payments) {
            await Payment.create({
                bill_number: bill.bill_number,
                user_id: userID,
                method: payment.method,
                amount: payment.amount
            }, { transaction });
        }

        await transaction.commit(); // Commit the transaction
        return res.status(201).json({ 
            message: 'Bill created successfully', 
            bill,
            stockUpdates,
            items   
        });
    } catch (error) {
        await transaction.rollback(); // Rollback the transaction in case of an error
        console.error(error);
        return res.status(500).json({ 
            message: 'Error creating bill', 
            error: error.message, 
            stack: error.stack 
        });
    }
}


// Function to get all bill details
async function getBillDetails(req, res) {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Fetch bills for the user
        const bills = await Bill.findAll({
            where: { user_id: userId },
            attributes: ['bill_number', 'user_id', 'subtotal', 'gst', 'gst_rate', 'servicecharge', 'servicechargeamount', 'total', 'timestamp', 'payload_id', 'billed_user'],
        });

        // Fetch items and payments for the user
        const [items, payments] = await Promise.all([
            Item.findAll({ where: { user_id: userId }, attributes: ['bill_number', 'name', 'price', 'quantity', 'category', 'available'] }),
            Payment.findAll({ where: { user_id: userId }, attributes: ['bill_number', 'method', 'amount'] }),
        ]);

        if (!bills.length && !items.length && !payments.length) {
            return res.status(404).json({ message: 'No data found for the requested user' });
        }

        // Group items and payments by bill_number
        const itemsByBill = groupBy(items, 'bill_number');
        const paymentsByBill = groupBy(payments, 'bill_number');

        // Build response
        const response = bills.map((bill) => ({
            billNumber: bill.bill_number,
            timestamp: bill.timestamp,
            subtotal: parseFloat(bill.subtotal),
            gst: parseFloat(bill.gst),
            gstRate: parseFloat(bill.gst_rate),
            serviceCharge: parseFloat(bill.servicecharge),
            serviceChargeAmount: parseFloat(bill.servicechargeamount),
            billed_user: bill.billed_user,
            payload_id: bill.payload_id,
            total: parseFloat(bill.total),
            items: itemsByBill[bill.bill_number] || [],
            payments: paymentsByBill[bill.bill_number] || [],
        }));

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in getBillDetails:', error.message, error.stack);
        return res.status(500).json({
            message: 'Error fetching details',
            error: error.message,
        });
    }
}

// Function to group data by a key
function groupBy(array, key) {
    return array.reduce((acc, obj) => {
        const group = obj[key];
        acc[group] = acc[group] || [];
        acc[group].push(obj);
        return acc;
    }, {});
}



// Function to get all active billss
async function getactivebills(req, res) {
    const { userId } = req.query;
 
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
 
    try {
        // Fetch items for the user
        const items = await Item.findAll({
            where: { user_id: userId },
        });
 
        // Fetch payments for the user
        const payments = await Payment.findAll({
            where: { user_id: userId },
        });
 
        // Check if no details were found
        if (!items.length && !payments.length) {
            return res.status(404).json({ message: 'No items or payments found for the requested user' });
        }
 
        return res.status(200).json({ items, payments });
    } catch (error) {
        console.error('Error in getBillDetails:', error);
        return res.status(500).json({ message: 'Error fetching details', error });
    }
}
module.exports = { createBill, getBillDetails, getactivebills };
