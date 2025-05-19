const Subscription = require('../models/Subscription');

/**
 * Extend the subscription for a given user.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const renewSubscription = async (req, res) => {
  const { user_id, duration } = req.body;

  if (!user_id || !duration) {
    return res.status(400).json({ message: "User ID and duration are required." });
  }

  let interval;
  switch (duration) {
    case '1month':
      interval = 1; // Use number for duration
      break;
    case '3months':
      interval = 3;
      break;
    case '6months':
      interval = 6;
      break;
    case '1year':
      interval = 12;
      break;
    default:
      return res.status(400).json({ message: "Invalid duration format." });
  }

  try {
    // Find the user's current subscription
    const subscription = await Subscription.findOne({
      where: { user_id }
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found for this user." });
    }

    // Calculate the new end_date by adding the interval (in months)
    const newEndDate = new Date(subscription.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + interval);

    // Update the subscription in the database
    await subscription.update({ end_date: newEndDate });

    return res.json({
      message: `Subscription extended by ${duration} successfully.`,
      newEndDate
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { renewSubscription };
