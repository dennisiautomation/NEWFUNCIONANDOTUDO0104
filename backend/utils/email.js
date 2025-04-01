const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 * @returns {Promise} - Nodemailer send result
 */
exports.sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Newcash Bank" <noreply@newcashbank.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      ...(options.html && { html: options.html })
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @returns {Promise} - Email send result
 */
exports.sendWelcomeEmail = async (user) => {
  return exports.sendEmail({
    to: user.email,
    subject: 'Welcome to Newcash Bank',
    text: `Hello ${user.name},\n\nWelcome to Newcash Bank! Your account has been successfully created.\n\nYou can now log in to your account and start managing your finances.\n\nBest regards,\nNewcash Bank Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0066cc;">Welcome to Newcash Bank!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for creating an account with Newcash Bank. Your account has been successfully created.</p>
        <p>You can now log in to your account and start managing your finances.</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Login to Your Account
          </a>
        </p>
        <p>Best regards,<br>Newcash Bank Team</p>
      </div>
    `
  });
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise} - Email send result
 */
exports.sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  return exports.sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please use the following link to reset your password (valid for 1 hour): ${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0066cc;">Password Reset Request</h2>
        <p>You requested a password reset for your Newcash Bank account.</p>
        <p>Please click the button below to reset your password (this link is valid for 1 hour):</p>
        <p>
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Reset Your Password
          </a>
        </p>
        <p>If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>
        <p>Best regards,<br>Newcash Bank Team</p>
      </div>
    `
  });
};

/**
 * Send transaction notification email
 * @param {Object} user - User object
 * @param {Object} transaction - Transaction details
 * @returns {Promise} - Email send result
 */
exports.sendTransactionNotification = async (user, transaction) => {
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  const formattedAmount = formatCurrency(transaction.amount, transaction.currency);
  
  return exports.sendEmail({
    to: user.email,
    subject: `Transaction Notification: ${transaction.transactionType}`,
    text: `Hello ${user.name},\n\nA ${transaction.transactionType} transaction of ${formattedAmount} has been ${transaction.status} on your account.\n\nTransaction details:\n- Reference: ${transaction.reference || 'N/A'}\n- Date: ${new Date(transaction.createdAt).toLocaleString()}\n\nIf you did not initiate this transaction, please contact our support team immediately.\n\nBest regards,\nNewcash Bank Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0066cc;">Transaction Notification</h2>
        <p>Hello ${user.name},</p>
        <p>A <strong>${transaction.transactionType}</strong> transaction of <strong>${formattedAmount}</strong> has been <strong>${transaction.status}</strong> on your account.</p>
        <h3>Transaction Details:</h3>
        <ul>
          <li><strong>Reference:</strong> ${transaction.reference || 'N/A'}</li>
          <li><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</li>
          <li><strong>Status:</strong> ${transaction.status}</li>
        </ul>
        <p style="color: #c00; font-weight: bold;">If you did not initiate this transaction, please contact our support team immediately.</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/transactions" 
             style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            View Transaction History
          </a>
        </p>
        <p>Best regards,<br>Newcash Bank Team</p>
      </div>
    `
  });
};
