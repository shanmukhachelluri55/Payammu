// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Route for user registration
router.post(
  '/register',
  authController.registerUser
);

router.post('/send-otp', body('email').isEmail(), authController.sendOTP);
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], authController.verifyOTP);

// Route for user login
router.post('/login', authController.loginUser);
router.post('/reset-password', authController.resetPassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp-resetpassword', authController.verifyOTPResetpassword);
router.post('/AddNewrole', authController.AddNewRole);
router.get('/user-details' ,authController.getUserDetails);


module.exports = router;
