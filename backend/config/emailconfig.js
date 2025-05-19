const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'payammu44@gmail.com',
    pass: 'nkdv kvon qlkx sore'
  }
});

module.exports = transporter;