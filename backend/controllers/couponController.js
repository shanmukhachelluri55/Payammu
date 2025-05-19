const Coupon = require('../models/couponModel');

// Create a new coupon
const createCoupon = async (req, res) => {
  try {
    // Log the request body to verify the incoming data
    console.log(req.body);

    const { code, discount, type, validUntil, description, minBillAmount, userId } = req.body;

    if (!code || !discount || !type || !validUntil || !minBillAmount || !userId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if userId is passed correctly
    console.log('userId:', userId);

    const newCoupon = await Coupon.create({
      code,
      discount,
      type,
      validUntil,
      description,
      minBillAmount,
      userId
    });

    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

// Get all coupons for a specific user
const getCoupons = async (req, res) => {
  try {
    const { userId } = req.params;

    // Use Sequelize's `findAll` to retrieve coupons based on userId
    const coupons = await Coupon.findAll({
      where: { userId }
    });

    if (coupons.length === 0) {
      return res.status(404).json({ message: `No coupons found for userId ${userId}` });
    }

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving coupons', error: error.message });
  }
};

// Delete a coupon by ID
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    // Use Sequelize's `destroy` method to delete coupon by ID
    const rowsDeleted = await Coupon.destroy({
      where: { id }
    });

    if (rowsDeleted === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  deleteCoupon,
};
