const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');
const billRoutes = require('./routes/billRoutes');
const cancelledBillsRouter = require('./routes/cancelledBillsRouter');
const initializeDatabase = require('./models/dbInit');
const nextBillRouter = require('./routes/nextBillRouter');
const path = require('path');
const couponRoutes = require('./routes/coupons');
const customersRoutes = require('./routes/RoyaltyRoutes');
const razorpayRouter = require('./routes/RazorpayLookup');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const emailRoutes = require('./routes/emailRoutes'); // Import email routes
// const profileEditing = require('./routes/userRoutes')

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Serve static images from the 'uploads' folder in the root directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuration for development
app.use(cors());

// Body Parser for large payloads
app.use(express.json({ limit: '50mb' })); // Set JSON payload limit to 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Set URL-encoded payload limit to 50MB

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/cancelledbills', cancelledBillsRouter);
app.use('/api', nextBillRouter);
app.use('/api/coupons', couponRoutes);
app.use('/api/royalty', customersRoutes);
app.use('/api/razorpay', razorpayRouter); // Consolidated Razorpay routes
app.use('/api/subscriptions', subscriptionRoutes); // Corrected subscription route
app.use('/api', emailRoutes); // Add email routes for sending receipts
// app.use('/api/profile', profileEditing);

// Initialize database models
initializeDatabase();

// Sync Sequelize models and handle errors
sequelize
  .sync()
  .then(() => {
    console.log('Database connected and tables synced');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// Global Error Handling Middleware for Development
app.use((err, req, res, next) => {
  console.error(err.stack); // Log stack trace
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});