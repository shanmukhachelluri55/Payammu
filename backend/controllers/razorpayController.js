const RazorpayCredentials = require('../models/RazorpayCredentials');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Get Razorpay credentials by store_id
const getCredentialsByStoreId = async (req, res) => {
  const { store_id } = req.params;

  try {
    const credentials = await RazorpayCredentials.findOne({
      where: { store_id: parseInt(store_id, 10) },
    });

    if (!credentials) {
      return res.status(404).json({ error: 'Credentials not found for the given store ID.' });
    }

    res.json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Save or update Razorpay credentials
const saveOrUpdateCredentials = async (req, res) => {
  const { store_id, key_id, key_secret } = req.body;

  if (!store_id || !key_id || !key_secret) {
    return res.status(400).json({ error: 'All fields (store_id, key_id, key_secret) are required.' });
  }

  try {
    const storeIdInt = parseInt(store_id, 10);

    const [credentials, created] = await RazorpayCredentials.upsert(
      { store_id: storeIdInt, key_id, key_secret },
      { returning: true }
    );

    res.status(created ? 201 : 200).json({
      message: created ? 'Credentials created successfully.' : 'Credentials updated successfully.',
      credentials,
    });
  } catch (error) {
    console.error('Error saving/updating credentials:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create an order
const createOrder = async (req, res) => {
  const { amount, currency, store_id } = req.body;

  // Validate input
  if (!amount || !store_id) {
    return res.status(400).json({ error: 'Amount and store_id are required.' });
  }

  try {
    // Fetch credentials for the store
    const credentials = await RazorpayCredentials.findOne({ where: { store_id } });

    if (!credentials) {
      return res.status(404).json({ error: 'Store not found or credentials not set.' });
    }

    const { key_id, key_secret } = credentials;

    // Initialize Razorpay instance
    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(amount * 100), // Razorpay accepts amounts in paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    // Return order details
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, store_id } = req.body;

  // Validate input
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !store_id) {
    return res.status(400).json({
      error: 'All fields (razorpay_order_id, razorpay_payment_id, razorpay_signature, store_id) are required.',
    });
  }

  try {
    // Fetch credentials for the store
    const credentials = await RazorpayCredentials.findOne({ where: { store_id } });

    if (!credentials) {
      return res.status(404).json({ error: 'Store not found or credentials not set.' });
    }

    const { key_secret } = credentials;

    // Generate signature and validate
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', key_secret).update(body).digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.status(200).json({ status: 'success', message: 'Payment verified successfully.' });
    } else {
      res.status(400).json({ status: 'failure', error: 'Invalid signature.' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getCredentialsByStoreId,
  saveOrUpdateCredentials,
  createOrder,
  verifyPayment,
};
