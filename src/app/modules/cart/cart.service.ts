import { Types } from 'mongoose';
import { Cart } from './cart.model';
import { ICart } from './cart.interface';
import { UserModel } from '../user/user.model';
import AppError from '../../errors/appError';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

// Calculate total amount for the cart
const calculateTotalAmount = (items: ICart['items']) => {
  return items.reduce((total, item) => {
    let itemTotal = item.price * item.quantity;

    // Add additional costs from add-ons
    if (item.customization?.addOns && item.customization.addOns.length > 0) {
      const addOnsTotal = item.customization.addOns.reduce(
        (sum, addon) => sum + addon.price,
        0
      );
      itemTotal += addOnsTotal * item.quantity;
    }

    return total + itemTotal;
  }, 0);
};

// Add item to cart
const addToCart = async (userId: string, cartData: Partial<ICart>) => {
  try {
    // Validate userId
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Valid user ID is required');
    }
    
    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Ensure items array exists and is not empty
    if (!cartData.items || cartData.items.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Items are required');
    }

    // Validate each item has required fields
    cartData.items.forEach(item => {
      if (!item.mealId || !Types.ObjectId.isValid(item.mealId.toString())) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Valid meal ID is required for each item');
      }
      if (!item.providerId || !Types.ObjectId.isValid(item.providerId.toString())) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Valid provider ID is required for each item');
      }
      if (!item.price || item.price < 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Valid price is required for each item');
      }
    });

    // Calculate total amount
    const totalAmount = calculateTotalAmount(cartData.items || []);

    // Check if user already has a cart
    let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });

    if (cart) {
      // If cart exists, update it
      const currentItems = [...cart.items];
      
      // Add new items to the cart
      if (cartData.items) {
        cartData.items.forEach(newItem => {
          const existingItemIndex = currentItems.findIndex(
            item => item.mealId.toString() === newItem.mealId.toString()
          );

          if (existingItemIndex !== -1) {
            // Update existing item
            currentItems[existingItemIndex] = {
              ...currentItems[existingItemIndex],
              ...newItem,
              quantity: currentItems[existingItemIndex].quantity + newItem.quantity
            };
          } else {
            // Add new item
            currentItems.push(newItem);
          }
        });
      }

      // Update cart with new items and recalculate total
      cart.items = currentItems;
      cart.totalAmount = calculateTotalAmount(currentItems);
      
      // Update delivery address if provided
      if (cartData.deliveryAddress) {
        cart.deliveryAddress = cartData.deliveryAddress;
      }

      // Update customerEmail if provided
      if (cartData.customerEmail) {
        cart.customerEmail = cartData.customerEmail;
      }

      const updatedCart = await cart.save();
      return updatedCart;
    } else {
      // Create new cart
      const newCartData: ICart = {
        userId: new Types.ObjectId(userId),
        customerName: user.name,
        customerId: user._id,
        customerEmail: cartData.customerEmail || user.email,
        items: cartData.items || [],
        totalAmount,
        deliveryAddress: cartData.deliveryAddress || '',
      };

      const newCart = await Cart.create(newCartData);
      return newCart;
    }
  } catch (error) {
    console.error('Error in addToCart service:', error);
    throw error;
  }
};

// Get user's cart
const getCart = async (userId: string) => {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid user ID is required');
  }
  
  const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  
  if (!cart) {
    return { 
      userId, 
      items: [], 
      totalAmount: 0,
      deliveryAddress: ''
    };
  }
  
  return cart;
};

// Update cart item
const updateCartItem = async (
  userId: string, 
  mealId: string, 
  updateData: { 
    quantity?: number;
    customization?: {
      spiceLevel?: string;
      removedIngredients?: string[];
      addOns?: { name: string; price: number }[];
      specialInstructions?: string;
    }
  }
) => {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid user ID is required');
  }
  
  if (!mealId || !Types.ObjectId.isValid(mealId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid meal ID is required');
  }
  
  const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }
  
  const itemIndex = cart.items.findIndex(
    item => item.mealId.toString() === mealId
  );
  
  if (itemIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, 'Item not found in cart');
  }
  
  // Update quantity if provided
  if (updateData.quantity) {
    cart.items[itemIndex].quantity = updateData.quantity;
  }
  
  // Update customization if provided
  if (updateData.customization) {
    cart.items[itemIndex].customization = {
      ...cart.items[itemIndex].customization,
      ...updateData.customization
    };
  }
  
  // Recalculate total amount
  cart.totalAmount = calculateTotalAmount(cart.items);
  
  const updatedCart = await cart.save();
  return updatedCart;
};

// Remove item from cart
const removeCartItem = async (userId: string, mealId: string) => {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid user ID is required');
  }
  
  if (!mealId || !Types.ObjectId.isValid(mealId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid meal ID is required');
  }
  
  const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }
  
  const initialItemsCount = cart.items.length;
  cart.items = cart.items.filter(item => item.mealId.toString() !== mealId);
  
  if (cart.items.length === initialItemsCount) {
    throw new AppError(httpStatus.NOT_FOUND, 'Item not found in cart');
  }
  
  // If all items are removed, delete the cart
  if (cart.items.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return { success: true, message: 'Cart is now empty and has been removed' };
  }
  
  // Recalculate total amount
  cart.totalAmount = calculateTotalAmount(cart.items);
  
  const updatedCart = await cart.save();
  return updatedCart;
};

// Clear cart
const clearCart = async (userId: string) => {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid user ID is required');
  }
  
  const result = await Cart.findOneAndDelete({ 
    userId: new Types.ObjectId(userId) 
  });
  
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }
  
  return { success: true, message: 'Cart cleared successfully' };
};

// Get cart by user email
const getCartByEmail = async (email: string) => {
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid email is required');
  }
  
  // Find user by email first
  const UserModel = mongoose.model('User');
  const user = await UserModel.findOne({ email });
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, `User with email ${email} not found`);
  }
  
  // Then get their cart using the existing function
  return await getCart(user._id.toString());
};

// Delete cart by user email
const deleteCartByEmail = async (email: string) => {
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid email is required');
  }
  
  // Find user by email first
  const UserModel = mongoose.model('User');
  const user = await UserModel.findOne({ email });
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, `User with email ${email} not found`);
  }
  
  // Then delete their cart using the existing function
  return await clearCart(user._id.toString());
};

// Remove specific meal from cart by user email
const removeItemByEmail = async (email: string, mealId: string) => {
  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid email is required');
  }
  
  if (!mealId || !Types.ObjectId.isValid(mealId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Valid meal ID is required');
  }
  
  // Find user by email first
  const UserModel = mongoose.model('User');
  const user = await UserModel.findOne({ email });
  
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, `User with email ${email} not found`);
  }
  
  // Then remove the specific meal item from their cart
  return await removeCartItem(user._id.toString(), mealId);
};

export const CartServices = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartByEmail,
  deleteCartByEmail,
  removeItemByEmail
}; 