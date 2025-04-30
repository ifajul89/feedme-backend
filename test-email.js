// Simple email test script to verify email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

// Log environment variables (password redacted for security)
console.log('Email Config:', {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? '********' : 'not set',
});

async function sendTestEmail() {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('Transporter created, attempting to verify connection...');

    // Verify connection
    await transporter.verify();
    console.log('Connection verified successfully!');

    // Set up recipient from command line or use default
    const recipient = process.argv[2] || 'test@example.com';
    console.log(`Sending test email to ${recipient}`);

    // Send email
    const info = await transporter.sendMail({
      from: `"FeedMe Test" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: 'Test Email from FeedMe',
      html: `
        <h1>Email Test</h1>
        <p>This is a test email to verify your email configuration.</p>
        <p>If you're seeing this, your email is working!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    if (process.env.EMAIL_HOST.includes('gmail')) {
      console.log('\nNOTE FOR GMAIL USERS:');
      console.log(
        '1. Make sure 2-factor authentication is enabled on your Google account',
      );
      console.log('2. Use an "App Password" instead of your regular password');
      console.log(
        '3. Generate App Password: Google Account → Security → App Passwords',
      );
    }
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);

    // Provide specific guidance for common errors
    if (error.code === 'EAUTH') {
      console.log(
        '\nAUTHENTICATION ERROR: Your username or password was rejected.',
      );
      console.log('If using Gmail:');
      console.log('1. Enable 2-factor authentication');
      console.log(
        '2. Generate an App Password at: Google Account → Security → App Passwords',
      );
      console.log('3. Use that App Password in your .env file');
    } else if (error.code === 'ESOCKET') {
      console.log('\nCONNECTION ERROR: Could not connect to the email server.');
      console.log('Please check:');
      console.log('1. Your EMAIL_HOST and EMAIL_PORT settings');
      console.log('2. Your network/firewall is not blocking the connection');
    }
  }
}

// Run the test
sendTestEmail();
