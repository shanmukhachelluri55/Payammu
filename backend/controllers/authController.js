const { validationResult } = require('express-validator');
const { Op } = require('sequelize'); // Import Sequelize operators
const bcrypt = require('bcrypt');
const User = require('../models/User');
const OTP = require('../models/OTP');
const transporter = require('../config/emailconfig');
const { generateOTP, createEmailTemplate } = require('../utils/Otputils');
const Subscription = require('../models/Subscription'); // Import Subscription model
const fs = require('fs');
const path = require('path');

const Payload = require('../models/Payload');

const otpStore = new Map();

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    // Save OTP in the database
    await OTP.create({
      email,
      otp: await bcrypt.hash(otp, 10), // Hash OTP for security
      expiresAt
    });

    // Send OTP via email
    await transporter.sendMail({
      from: 'payammu44@gmail.com',
      to: email,
      subject: 'Email Verification Code',
      html: createEmailTemplate(otp)
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Retrieve the latest OTP for the email
    const otpRecord = await OTP.findOne({
      where: {
        email,
        isVerified: false,
        expiresAt: {
          [Op.gt]: new Date() // Check if OTP is not expired
        }
      },
      order: [['createdAt', 'DESC']] // Use the most recent OTP
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found'
      });
    }

    // Compare the provided OTP with the stored hashed OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark OTP as verified
    await otpRecord.update({ isVerified: true });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// Register User

exports.registerUser = async (req, res) => {
  console.log('Received data from frontend:', req.body);

  // Check for validation errors manually within the controller
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  // Destructure necessary fields from the request body
  const { email, password, shopName, category, address, gstin, role, phone_number, subscription, image, licence_name } = req.body;

  // Define the valid roles in uppercase
  const validRoles = [
    'UNIVERSAL_ADMIN',
    'MANAGE_ADMIN',
    'ORGANIZATION_ADMIN',
    'MANAGER',
    'STAFF',
    'KITCHEN',
    'DELIVERY'
  ];

  try {
    // Check if the email is already in use
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Check if the phone number is already in use
    const existingPhone = await User.findOne({ where: { phone_number } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number is already in use' });
    }

    // Check if the role is valid
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Image handling logic (if image is provided)
    let imageData = null;

    if (image) {
      // Directly use the base64 string (with prefix) from the payload
      imageData = image;  // No need to remove the prefix
    }

    // Create a new user in the database, including the license_name and image data
    const newUser = await User.create({
      email,
      password: hashedPassword,
      phone_number,
      role,
      shop_name: shopName,
      subscription,
      category,
      address,
      gstin: gstin || null,  // Handle optional GSTIN
      image: imageData || null,  // Store base64 image data directly in the database
      licence_name: licence_name, // Include license_name in the User table
    });

    console.log('New user created:', newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      userId: newUser.user_id,  // Assuming user_id is the correct field name
      address: newUser.address,
      role: newUser.role, // Returning the user's role
      licence_name: newUser.licence_name, // Returning the license_name
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Server error, please try again' });
  }
};





// login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await Payload.findOne({
      where: { email },
      attributes: ['payload_id', 'user_id', 'email', 'password', 'role', 'licence_name'],
    });

    if (!user) {
      console.log("No user found with email:", email);
      return res.status(404).json({ message: 'Invalid email or password.' });
    }

    console.log("Email found:", email);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Password mismatch for email:", email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const subscription = await Subscription.findOne({
      where: { user_id: user.user_id },
      attributes: ['end_date'],
    });

    if (!subscription) {
      console.log(`No subscription found for user ID: ${user.user_id}`);
      return res.status(403).json({ message: 'No active subscription found. Please subscribe to access.' });
    }

    const currentDate = new Date();
    if (new Date(subscription.end_date) < currentDate) {
      console.log(`Subscription expired for user ID: ${user.user_id}`);
      return res.status(403).json({ message: 'Subscription expired. Please renew to access.' });
    }

    // Fetch user details, including phone_number
    const userDetails = await User.findOne({
      where: { user_id: user.user_id },
      attributes: ['shop_name', 'address', 'gstin', 'image', 'phone_number'], // Added phone_number
    });

    let imageBase64 = null;
    if (userDetails && userDetails.image) {
      imageBase64 = userDetails.image;
    }

    return res.status(200).json({
      message: 'Login successful.',
      user_id: user.user_id,
      email: user.email,
      name: user.licence_name,
      license_id: user.payload_id,
      role: user.role,
      shopName: userDetails.shop_name,
      address: userDetails.address,
      gstin: userDetails.gstin || 'N/A',
      phoneNumber: userDetails.phone_number || 'N/A', // Added phone_number
      imageUrl: imageBase64,
    });

  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      message: 'Server error, please try again.',
      error: error.message,
    });
  }
};





// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
   
    // Check if user exists
    const user = await Payload.findOne({ where: { email },attributes: ['payload_id', 'user_id', 'email', 'password', 'role'],  });
    if (!user) {            
      return res.status(404).json({ message: 'User not found' });
    }
 
    // Generate OTP
    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });
 
    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <h1>Password Reset Request</h1>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `
    });
 
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
 
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
 
    // Fetch user
    const user = await Payload.findOne({
      where: { email },
      attributes: ['payload_id', 'user_id', 'email', 'password', 'role'], // Explicit attributes
    });
 
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }
 
    console.log('User fetched for password reset:', user.toJSON());
 
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
 
    // Update password in the database
    await Payload.update(
      { password: hashedPassword },
      { where: { email },  logging: console.log, silent: true } // Disable logging timestamps  }
    );
 
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
 
// Verify OTP for Reset Password
exports.verifyOTPResetpassword = async (req, res) => {
  try {
    const { email, otp } = req.body;
   
    const storedOTPData = otpStore.get(email);
    if (!storedOTPData) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }
 
    // Check OTP expiration (10 minutes)
    if (Date.now() - storedOTPData.timestamp > 10 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired' });
    }
 
    // Verify OTP
    if (storedOTPData.otp !== otp) {
      storedOTPData.attempts += 1;
      if (storedOTPData.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'Too many failed attempts' });
      }
      return res.status(400).json({ message: 'Invalid OTP' });
    }
 
    otpStore.delete(email);
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

// Verify OTP for Reset Password
exports.verifyOTPResetpassword = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const storedOTPData = otpStore.get(email);
    if (!storedOTPData) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    // Check OTP expiration (10 minutes)
    if (Date.now() - storedOTPData.timestamp > 10 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Verify OTP
    if (storedOTPData.otp !== otp) {
      storedOTPData.attempts += 1;
      if (storedOTPData.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'Too many failed attempts' });
      }
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(email);
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error, please try again' });
  }
};


exports.AddNewRole = async (req, res) => {
  try {
    const { user_id, email, password, role ,licence_name} = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
    }

    // Check if the email already exists
    const existingPayload = await Payload.findOne({ where: { email } });
    if (existingPayload) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the payload record
    const newPayload = await Payload.create({
      user_id,         // user_id can be null or provided
      email,
      password: hashedPassword,
      role,
      licence_name,
    });

    // Respond with success
    return res.status(201).json({
      success: true,
      message: 'Payload created successfully.',
      data: {
        payload_id: newPayload.payload_id,
        user_id: newPayload.user_id,
        email: newPayload.email,
        role: newPayload.role,
        licence_name:newPayload.licence_name,
      },
    });
  } catch (error) {
    console.error('Error creating payload:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the payload.',
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    // Fetching users with basic details
    const users = await User.findAll({
      attributes: ['user_id', 'email', 'shop_name'], // Specify required User attributes
    });

    // Fetching subscriptions for the users
    const subscriptions = await Subscription.findAll({
      attributes: ['user_id', 'subscription','start_date', 'end_date'], // Specify required Subscription fields
    });

    // Combining user data with their subscription data
    const userDetails = users.map((user) => {
      // Find the corresponding subscription for each user
      const subscription = subscriptions.find(
        (sub) => sub.user_id === user.user_id
      ) || {}; // If no subscription found, use an empty object

      return {
        user_id: user.user_id,
        email: user.email,
        licence_name: user.shop_name,
        subscription:subscription.subscription,
        start_date: subscription.start_date || 'N/A', // Default to 'N/A' if no subscription
        end_date: subscription.end_date || 'N/A', // Default to 'N/A' if no subscription
      };
    });

    res.status(200).json({
      success: true,
      data: userDetails,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message,
    });
  }
};