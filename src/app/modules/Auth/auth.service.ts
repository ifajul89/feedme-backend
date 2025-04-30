import jwt, { JwtPayload } from 'jsonwebtoken';
import { TUser } from '../user/user.interface';
import { UserModel } from '../user/user.model';
import { IForgotPasswordRequest, ILogInUser, IResetPasswordRequest } from './auth.interface';
import bcrypt from 'bcrypt';
import config from '../../config';
import AppError from '../../errors/appError';
import httpStatus from 'http-status';
import crypto from 'crypto';
import sendEmail from '../../utils/sendEmail';

const register = async (payload: TUser) => {
  const result = await UserModel.create(payload);
  return result;
};

const login = async (payload: ILogInUser) => {
  const user = await UserModel.findOne({ email: payload?.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found.');
  }
  const isBlocked = user?.isBlocked;
  if (isBlocked === true) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account has been Deactivated. Please contact support for assistance.',
    );
  }

  // console.log('Login attempt for:', payload.email);
  //console.log('Input password:', payload.password);
  //console.log('Stored hashed password:', user.password);

  // Make sure we're passing strings to bcrypt.compare
  const inputPassword = String(payload?.password || '');
  const storedPassword = String(user?.password || '');

  // Ensure proper comparison
  try {
    const checkPassword = await bcrypt.compare(inputPassword, storedPassword);
    // console.log('Password comparison result:', checkPassword);

    if (!checkPassword) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Password does not match!');
    }
  } catch {
    // Password comparison failed
    throw new AppError(httpStatus.UNAUTHORIZED, 'Password does not match!');
  }

  // generate token for authorization
  const token = jwt.sign(
    {
      email: user?.email,
      role: user?.role,
      userId: user?._id,
    },
    config.JWT_ACCESS_SECRET as string,
    { expiresIn: '30d' },
  );
  // console.log(token);
  const refreshToken = jwt.sign(
    {
      email: user?.email,
      role: user?.role,
      userId: user?._id,
    },
    config.JWT_REFRESH_SECRET as string,
    { expiresIn: '365d' },
  );

  const verifyUser = {
    name: user.name,
    email: user?.email,
    role: user?.role,
    id: user?._id,
    address: user?.address,
    phone: user?.phone
  };
  // console.log(user);

  return { token, refreshToken, verifyUser };
};

const refreshToken = async (token: string) => {
  // checking if the given token is valid
  let decoded;
  try {
    decoded = jwt.verify(
      token,
      config.JWT_REFRESH_SECRET as string,
    ) as JwtPayload;
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const { email } = decoded;

  // checking if the user is exist
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // checking if the user is blocked
  const userStatus = user?.isBlocked;

  if (userStatus === true) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your account has been Deactivated. Please contact support for assistance.',
    );
  }

  const newAccessToken = jwt.sign(
    {
      email: user?.email,
      role: user?.role,
      userId: user?._id,
    },
    config.JWT_ACCESS_SECRET as string,
    { expiresIn: '10d' },
  );

  return { accessToken: newAccessToken };
};

// Forgot password functionality
const forgotPassword = async (payload: IForgotPasswordRequest) => {
  console.log('Forgot password request for email:', payload.email);
  
  // Find the user by email
  const user = await UserModel.findOne({ email: payload.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found with this email');
  }

  // Generate a random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expiry (10 minutes)
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Save the reset token and expiry to the user document
  await UserModel.findByIdAndUpdate(user._id, {
    passwordResetToken,
    passwordResetExpires,
  });

  // Create reset URL
  const resetURL = `${config.CLIENT_URL}/reset-password/${resetToken}`;

  // Create email message
  const message = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset for your FeedMe account.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetURL}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 20px; margin: 8px 0; border: none; cursor: pointer; border-radius: 4px; text-decoration: none;">Reset Password</a>
    <p>This link will expire in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
  `;

  console.log('Preparing to send password reset email to:', user.email);
  console.log('Email config in forgotPassword:', {
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS ? '[REDACTED]' : 'undefined'
  });

  try {
    // Send email
    const result = await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Token (valid for 10 min)',
      html: message,
    });

    console.log('Password reset email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });

    return {
      status: 'success',
      message: 'Password reset link sent to email',
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    // If email sending fails, clear the reset token fields
    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'There was an error sending the email. Please try again later.',
    );
  }
};

// Reset password functionality
const resetPassword = async (payload: IResetPasswordRequest) => {
  // Hash the token from the URL
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(payload.token)
    .digest('hex');

  // Find user with the token and check if token is still valid
  const user = await UserModel.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Token is invalid or has expired',
    );
  }

  // Update the user's password and clear reset token fields
  user.password = payload.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Save the user
  await user.save();

  return {
    status: 'success',
    message: 'Password reset successful',
  };
};

export const authService = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
};
