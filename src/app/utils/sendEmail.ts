import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
  email: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions) => {
  console.log('Attempting to send email to:', options.email);
  console.log('Email config:', {
    host: config.EMAIL_HOST,
    port: Number(config.EMAIL_PORT),
    secure: config.EMAIL_PORT === '465'
  });

  try {
    const transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: Number(config.EMAIL_PORT),
      secure: config.EMAIL_PORT === '465',
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });

    console.log('Nodemailer transporter created successfully');

    // Send email
    const info = await transporter.sendMail({
      from: `"FeedMe Support" <${config.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail; 