const express = require('express');
const router = express.Router();
const storeLookupController = require('../controllers/storeLookup'); // Adjust path as needed
const razorpayController = require('../controllers/razorpayController'); // Ensure path is correct

// Endpoint to search for a store by email
router.post('/store-lookup', storeLookupController.getStoreByEmail);

// Get Razorpay credentials by store ID
router.get('/:store_id', razorpayController.getCredentialsByStoreId);

// Save or update Razorpay credentials
router.post('/', razorpayController.saveOrUpdateCredentials);

// Create a Razorpay order
router.post('/create-order', razorpayController.createOrder);

// Verify Razorpay payment
router.post('/verify-payment', razorpayController.verifyPayment);

module.exports = router;
