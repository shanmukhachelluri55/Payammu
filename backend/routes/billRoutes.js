const express = require('express');
const { createBill, getBillDetails, getactivebills } = require('../controllers/billController');
const router = express.Router();

// POST route to create a new bill
router.post('/create', createBill);

// GET route to get all bill details
router.get('/details', getBillDetails);

// GET route to get active bill details
router.get('/activebills', getactivebills);

module.exports = router;
