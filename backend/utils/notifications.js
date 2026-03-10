const nodemailer = require('nodemailer');

// Create transporter (use Gmail or your SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use SMTP settings
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // App password for Gmail
  }
});

const sendNotificationEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    };
    await transporter.sendMail(mailOptions);
    console.log('Email sent to', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendNotificationEmail };