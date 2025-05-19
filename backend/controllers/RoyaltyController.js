const Customer = require('../models/royalty');  // Import the Customer model

const addCustomer = async (req, res) => {
  try {
    const { user_id, name, phone, email, address, royalty_points, usePoints } = req.body;

    // Validate required fields
    if (!user_id || !name || !phone || royalty_points === undefined || usePoints === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: user_id, name, phone, royalty_points, and usePoints are required'
      });
    }

    // Find if the customer with the same user_id and phone already exists
    const existingCustomer = await Customer.findOne({
      where: { user_id, phone }
    });

    if (existingCustomer) {
      if (usePoints) {
        // Reset points to 0 and add new points
        existingCustomer.royalty_points = royalty_points;
      } else {
        // Add new points to the existing points
        existingCustomer.royalty_points += royalty_points;
      }

      // Update optional fields if provided
      if (email) existingCustomer.email = email;
      if (address) existingCustomer.address = address;

      await existingCustomer.save(); // Save the updated customer

      return res.status(200).json({
        message: `Customer found. ${usePoints ? 'Points used and new points added' : 'Points added successfully'}`,
        customer: existingCustomer
      });
    } else {
      // Create a new customer if not found
      const newCustomer = await Customer.create({
        user_id,
        name,
        phone,
        email,
        address,
        royalty_points
      });

      return res.status(201).json({
        message: 'Customer added successfully',
        customer: newCustomer
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Controller to get a customer's details by user_id and phone
const getCustomerByUserIdAndPhone = async (req, res) => {
  try {
    const { user_id, phone } = req.params;

    // Find the customer by user_id and phone
    const customer = await Customer.findOne({
      where: { user_id, phone }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.status(200).json({
      message: 'Customer found',
      customer: {
        id: customer.id,
        user_id: customer.user_id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        royalty_points: customer.royalty_points
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

const getAllCustomersByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Find all customers associated with the given user_id
    const customers = await Customer.findAll({
      where: { user_id }
    });

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: 'No customers found for this user_id' });
    }

    return res.status(200).json({
      message: 'Customers found',
      customers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Export the controller functions
module.exports = {
  addCustomer,
  getCustomerByUserIdAndPhone,
  getAllCustomersByUserId,
};
