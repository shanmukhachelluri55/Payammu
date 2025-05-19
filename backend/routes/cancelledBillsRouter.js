const express = require('express');
const { createCancelledBill ,getCancelledBillsByUserId} = require('../controllers/cancelledBillsController');

const router = express.Router();

// Route: POST /api/cancelledbills/cancel/:userId
router.post('/cancel/:userId', createCancelledBill);

router.get('/user/:userId', getCancelledBillsByUserId);

module.exports = router;
