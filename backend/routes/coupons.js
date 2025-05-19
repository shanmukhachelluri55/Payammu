const express = require('express');
const { createCoupon, getCoupons, deleteCoupon } = require('../controllers/couponController');

const router = express.Router();

// Routes
router.post('/', createCoupon); // Create coupon
router.get('/:userId', getCoupons); // Get all coupons for a user
router.delete('/:id', deleteCoupon); // Delete coupon by ID

module.exports = router;
