const Payload = require('../models/Payload'); // Adjust the path to your model

// Search user by email and return the user_id
const getStoreByEmail = async (req, res) => {
  const { email } = req.body; // Extract email from the request body

  // Log the email for testing
  console.log('Received email for lookup:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find the user by email in the Payload model
    const user = await Payload.findOne({
      where: { email },
      attributes: ['user_id'], // Fetch only the user_id field
    });

    if (!user) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Send back the user_id
    return res.json({ store_id: user.user_id });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getStoreByEmail,
};
