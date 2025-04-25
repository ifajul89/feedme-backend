import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
  email: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: Number(config.EMAIL_PORT),
    secure: config.EMAIL_PORT === '465',
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
  });

  // Send email
  const info = await transporter.sendMail({
    from: `"FeedMe Support" <${config.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });

  return info;
};

export default sendEmail; 