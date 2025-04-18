import jwt, { JwtPayload } from 'jsonwebtoken';
import { TUser } from '../user/user.interface';
import { UserModel } from '../user/user.model';
import { ILogInUser } from './auth.interface';
import bcrypt from 'bcrypt';
import config from '../../config';
import AppError from '../../errors/appError';
import httpStatus from 'http-status';

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
  } catch (error) {
    // console.error('Password comparison error:', error);
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

export const authService = {
  register,
  login,
  refreshToken,
};
