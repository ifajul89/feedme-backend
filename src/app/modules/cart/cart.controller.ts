import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CartServices } from './cart.service';
import { Types } from 'mongoose';
import { UserModel } from '../user/user.model';

// Add to cart
const addToCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('In addToCart controller - body:', req.body);

      // Enhanced user validation
      if (!req.user || !req.user._id) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated or invalid user ID',
          data: null,
        });
      }

      // Validate user ID to ensure it's a valid ObjectId
      if (!Types.ObjectId.isValid(req.user._id)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid user ID format',
          data: null,
        });
      }

      const userId = req.user._id;
      
      // Process customization data from the frontend
      const {
        mealId,
        mealName,
        providerId,
        providerName,
        price,
        quantity = 1,
        deliveryDate,
        deliverySlot,
        deliveryAddress,
        // Customization options
        spiceLevel,
        removedIngredients = [],
        addOns = [],
      } = req.body;

      // Fix for typo in specialInstructions field
      const specialInstructions = req.body.specialInstructions || req.body.specialInstructionis || '';

      // Validate required fields
      if (!mealId || !Types.ObjectId.isValid(mealId)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Valid meal ID is required',
          data: null,
        });
      }

      if (!providerId || !Types.ObjectId.isValid(providerId)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Valid provider ID is required',
          data: null,
        });
      }
      
      // Always fetch the provider email from the database
      let providerEmail: string | undefined = undefined;
      try {
        const provider = await UserModel.findById(providerId);
        if (provider && provider.email) {
          providerEmail = provider.email;
        }
      } catch (error) {
        console.error('Error fetching provider email:', error);
        // Continue without provider email if there's an error
      }

      // Always get the customer email from the authenticated user
      let customerEmail: string | undefined = undefined;
      try {
        if (req.user.email) {
          customerEmail = req.user.email;
        }
      } catch (error) {
        console.error('Error accessing customer email:', error);
        // Continue without customer email if there's an error
      }

      // Format the cart data
      const cartData = {
        customerEmail,
        items: [{
          mealId,
          mealName,
          providerId,
          providerName,
          providerEmail,
          price,
          quantity,
          deliveryDate,
          deliverySlot,
          customization: {
            spiceLevel,
            removedIngredients,
            addOns: addOns.map((addon: { name: string, price: number }) => ({
              name: addon.name,
              price: addon.price
            })),
            specialInstructions
          }
        }],
        deliveryAddress
      };

      const result = await CartServices.addToCart(userId, cartData);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Item added to cart successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in addToCart controller:', error);
      next(error);
    }
  }
);

// Get cart
const getCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user._id) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated or invalid user ID',
          data: null,
        });
      }

      // Validate user ID format
      if (!Types.ObjectId.isValid(req.user._id)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid user ID format',
          data: null,
        });
      }

      const userId = req.user._id;
      const result = await CartServices.getCart(userId);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Cart retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in getCart controller:', error);
      next(error);
    }
  }
);

// Update cart item
const updateCartItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user._id) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated or invalid user ID',
          data: null,
        });
      }

      // Validate user ID format
      if (!Types.ObjectId.isValid(req.user._id)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid user ID format',
          data: null,
        });
      }

      const userId = req.user._id;
      const mealId = req.params.mealId;
      
      // Validate meal ID
      if (!mealId || !Types.ObjectId.isValid(mealId)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Valid meal ID is required',
          data: null,
        });
      }
      
      const updateData = req.body;

      const result = await CartServices.updateCartItem(userId, mealId, updateData);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Cart item updated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in updateCartItem controller:', error);
      next(error);
    }
  }
);

// Remove cart item
const removeCartItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user._id) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated or invalid user ID',
          data: null,
        });
      }

      // Validate user ID format
      if (!Types.ObjectId.isValid(req.user._id)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid user ID format',
          data: null,
        });
      }

      const userId = req.user._id;
      const mealId = req.params.mealId;
      
      // Validate meal ID
      if (!mealId || !Types.ObjectId.isValid(mealId)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Valid meal ID is required',
          data: null,
        });
      }

      const result = await CartServices.removeCartItem(userId, mealId);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Item removed from cart successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in removeCartItem controller:', error);
      next(error);
    }
  }
);

// Clear cart
const clearCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user._id) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated or invalid user ID',
          data: null,
        });
      }

      // Validate user ID format
      if (!Types.ObjectId.isValid(req.user._id)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Invalid user ID format',
          data: null,
        });
      }

      const userId = req.user._id;
      const result = await CartServices.clearCart(userId);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Cart cleared successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in clearCart controller:', error);
      next(error);
    }
  }
);

// Get cart by user email
const getCartByEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get email from query parameters
      const email = req.query.email as string;
      
      if (!email) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Email parameter is required',
          data: null,
        });
      }
      
      // Check if user exists in the request
      if (!req.user) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated',
          data: null,
        });
      }
      
      const result = await CartServices.getCartByEmail(email);
      
      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Cart retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in getCartByEmail controller:', error);
      next(error);
    }
  }
);

// Delete cart by user email
const deleteCartByEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get email from query parameters
      const email = req.query.email as string;
      
      if (!email) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Email parameter is required',
          data: null,
        });
      }
      
      // Check if user exists in the request
      if (!req.user) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated',
          data: null,
        });
      }
      
      const result = await CartServices.deleteCartByEmail(email);
      
      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Cart deleted successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in deleteCartByEmail controller:', error);
      next(error);
    }
  }
);

// Remove specific meal from cart by user email
const removeItemByEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get email from query parameters and mealId from route params
      const email = req.query.email as string;
      const mealId = req.params.mealId;
      
      if (!email) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Email parameter is required',
          data: null,
        });
      }
      
      if (!mealId || !Types.ObjectId.isValid(mealId)) {
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          status: false,
          message: 'Valid meal ID is required',
          data: null,
        });
      }
      
      // Check if user exists in the request
      if (!req.user) {
        return sendResponse(res, {
          statusCode: httpStatus.UNAUTHORIZED,
          status: false,
          message: 'Unauthorized: User not authenticated',
          data: null,
        });
      }
      
      const result = await CartServices.removeItemByEmail(email, mealId);
      
      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Item removed from cart successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in removeItemByEmail controller:', error);
      next(error);
    }
  }
);

export const CartControllers = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartByEmail,
  deleteCartByEmail,
  removeItemByEmail,
}; 