const express = require('express');
const multer = require('multer');
const { sendReceipt } = require('../controllers/emailController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

/**
 * POST /api/send-receipt
 * Upload a PDF file and send it as an email attachment.
 */
router.post('/send-receipt', upload.single('pdf'), (req, res, next) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded or file is not a PDF.' });
  }

  // Check if email is provided in the request body
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  // Proceed to the controller
  sendReceipt(req, res).catch(next); // Pass errors to the error handler
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Route error:', err);

  if (err instanceof multer.MulterError) {
    // Handle multer errors (e.g., file size limit exceeded)
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Only PDF files are allowed.') {
    return res.status(400).json({ error: err.message });
  }

  // Generic error response
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
});

module.exports = router;