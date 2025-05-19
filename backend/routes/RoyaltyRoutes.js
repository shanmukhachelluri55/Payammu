const express = require('express');
const router = express.Router();
const customersController = require('../controllers/RoyaltyController');

// POST: Create a new customer or update the royalty points
router.post('/customers', customersController.addCustomer);

// GET: Get customer by user_id and phone
router.get('/customers/:user_id/:phone', customersController.getCustomerByUserIdAndPhone);

// GET: Get all customers by user_id
router.get('/getcustomerdetails/:user_id', customersController.getAllCustomersByUserId); // Fixed route

// Export the router
module.exports = router;