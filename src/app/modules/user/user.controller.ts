/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { userService } from './user.service';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import { UserModel } from './user.model';

// 2. Get All user
const getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await userService.getAllUser();
    // console.log(result);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'User are retrieved successfully',
      data: result,
    });
    // res.send(result)
  },
);
// 3. Get a Specific user
const getSingleUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await userService.getSingleUser(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'user is retrieved successfully',
      data: result,
    });
  },
);

// Update user information
const updateUserInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { password, ...updatedData } = req.body;

    // Ensure user can only update their own info
    const user = req.user;

    if (!user) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        status: false,
        message: 'User not found or not authenticated',
        data: null,
      });
    }

    // Compare as strings to ensure proper comparison
    if (userId !== user._id.toString()) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        status: false,
        message: 'You are not authorized to update this user',
        data: null,
      });
    }

    // Verify password before allowing the update
    if (!password) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        status: false,
        message: 'Password is required to update profile information',
        data: null,
      });
    }

    // Get user with password
    const userDoc = await userService.getSingleUser(userId);

    if (!userDoc) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        status: false,
        message: 'User not found',
        data: null,
      });
    }

    // Verify the password is correct
    const isPasswordValid = await bcrypt.compare(password, userDoc.password);

    if (!isPasswordValid) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        status: false,
        message: 'Incorrect password. Cannot update profile information',
        data: null,
      });
    }

    // Process the update (password is removed from updatedData above)
    const result = await userService.updateUser(userId, updatedData);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'User information updated successfully',
      data: result,
    });
  },
);

// Change password
const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    console.log(`Change password attempt for userId: ${userId}`);

    // Ensure user can only change their own password
    const user = req.user;

    console.log(
      'User from request:',
      user ? `ID: ${user._id}, Email: ${user.email}` : 'No user in request',
    );

    if (!user) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        status: false,
        message: 'User not found or not authenticated',
        data: null,
      });
    }

    // Compare as strings to ensure proper comparison
    console.log(
      `Comparing requestedId: ${userId} with userTokenId: ${user._id.toString()}`,
    );
    if (userId !== user._id.toString()) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        status: false,
        message: `You are not authorized to change this password. Your user ID is ${user._id.toString()}. Please use this ID in the URL instead of ${userId}`,
        data: {
          yourUserId: user._id.toString(),
          correctUrl: `/api/user/change-password/${user._id.toString()}`,
        },
      });
    }

    // Verify the current password is correct
    const userDoc = await userService.getSingleUser(userId);

    if (!userDoc) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        status: false,
        message: 'User not found',
        data: null,
      });
    }

    // Check if the current password is correct
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userDoc.password,
    );

    if (!isPasswordValid) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        status: false,
        message: 'Current password is incorrect',
        data: null,
      });
    }

    // Update the password
    const result = await userService.changePassword(userId, newPassword);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Password changed successfully',
      data: { success: true },
    });
  },
);

// Admin update user (including role changes)
const adminUpdateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const updatedData = req.body;

    try {
      // Admin can update any user data including roles
      const result = await userService.adminUpdateUser(userId, updatedData);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'User information updated successfully by admin',
        data: result,
      });
    } catch (error: Error | unknown) {
      // Handle specific errors
      const err = error as Error;
      if (err.message.includes('Invalid ID')) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid ID',
          data: null,
          errorSources: [
            {
              path: '',
              message: err.message,
            },
          ],
        });
      } else if (err.message.includes('already exists')) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Email already exists',
          data: null,
          errorSources: [
            {
              path: '',
              message: err.message,
            },
          ],
        });
      } else if (err.message.includes('User not found')) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          status: false,
          message: 'User not found',
          data: null,
        });
      }

      // Default error handling
      return sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        status: false,
        message: 'Failed to update user',
        data: null,
        errorSources: [
          {
            path: '',
            message: err.message,
          },
        ],
      });
    }
  },
);

// Delete user (admin only)
const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    try {
      // Delete the user
      const result = await userService.deleteUser(userId);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'User deleted successfully',
        data: result,
      });
    } catch (error: Error | unknown) {
      // Handle specific errors
      const err = error as Error;
      if (err.message.includes('Invalid ID')) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid ID',
          data: null,
          errorSources: [
            {
              path: '',
              message: err.message,
            },
          ],
        });
      } else if (err.message.includes('User not found')) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          status: false,
          message: 'User not found',
          data: null,
        });
      }

      // Default error handling
      return sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        status: false,
        message: 'Failed to delete user',
        data: null,
        errorSources: [
          {
            path: '',
            message: err.message,
          },
        ],
      });
    }
  },
);

export const userController = {
  getUsers,
  getSingleUsers,
  updateUserInfo,
  changePassword,
  adminUpdateUser,
  deleteUser,
};
