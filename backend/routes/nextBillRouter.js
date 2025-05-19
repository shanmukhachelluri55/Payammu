const express = require('express');
const getNextBillNumber = require('../controllers/NextBillNumber');

const router = express.Router();

// Route to get the next bill number
router.get('/next-bill-number', async (req, res) => {
    const userId = req.query.userId;  // Extract userId from query parameters

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const nextBillNumber = await getNextBillNumber(userId);
        res.status(200).json({ nextBillNumber });
    } catch (error) {
        console.error('Error in /next-bill-number route:', error.message);
        res.status(500).json({ error: 'Failed to fetch the next bill number.' });
    }
});

module.exports = router;
