import express from 'express';
import { CartControllers } from './cart.controller';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import CartValidation from './cart.validation';

// USER role enum
enum ENUM_USER_ROLE {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
}

const router = express.Router();

// Add to cart route
router.post(
  '/',
  auth(ENUM_USER_ROLE.CUSTOMER),
  validateRequest(CartValidation.addToCartValidationSchema),
  CartControllers.addToCart
);

// Get user's cart
router.get(
  '/',
  auth(ENUM_USER_ROLE.CUSTOMER),
  CartControllers.getCart
);

// Update cart item
router.patch(
  '/item/:mealId',
  auth(ENUM_USER_ROLE.CUSTOMER),
  validateRequest(CartValidation.updateCartItemValidationSchema),
  CartControllers.updateCartItem
);

// Remove cart item
router.delete(
  '/item/:mealId',
  auth(ENUM_USER_ROLE.CUSTOMER),
  CartControllers.removeCartItem
);

// Clear cart
router.delete(
  '/',
  auth(ENUM_USER_ROLE.CUSTOMER),
  CartControllers.clearCart
);

// Get cart by user email
router.get(
  '/by-email',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.PROVIDER, ENUM_USER_ROLE.CUSTOMER),
  CartControllers.getCartByEmail
);

// Delete cart by user email
router.delete(
  '/by-email',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.PROVIDER, ENUM_USER_ROLE.CUSTOMER),
  CartControllers.deleteCartByEmail
);

// Remove specific meal from cart by user email
router.delete(
  '/by-email/item/:mealId',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.PROVIDER, ENUM_USER_ROLE.CUSTOMER),
  CartControllers.removeItemByEmail
);

export default router; 