const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail)
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.PASSWORD, // Your email password or app-specific password
  },
});

/**
 * Send a receipt via email with a PDF attachment.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const sendReceipt = async (req, res) => {
  const { email } = req.body;
  const pdfFile = req.file;

  // Validate input
  if (!email || !pdfFile) {
    return res.status(400).json({ error: 'Email and PDF file are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Configure email options
  const mailOptions = {
    from: process.env.EMAIL, // Sender email
    to: email, // Recipient email
    subject: 'Your Receipt', // Email subject
    text: 'Please find your receipt attached.', // Email body
    attachments: [
      {
        filename: pdfFile.originalname || 'receipt.pdf', // Use a default name if originalname is missing
        content: pdfFile.buffer, // PDF file buffer
      },
    ],
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Receipt sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);

    // Handle specific errors
    if (error.code === 'EAUTH') {
      return res.status(500).json({ error: 'Authentication failed. Check your email credentials.' });
    }

    if (error.code === 'EENVELOPE') {
      return res.status(500).json({ error: 'Invalid recipient email address.' });
    }

    // Generic error response
    res.status(500).json({ error: 'Failed to send receipt. Please try again.' });
  }
};

module.exports = { sendReceipt };