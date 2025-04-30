import express from 'express';
import { orderController } from './order.controller';
import validateRequest from '../../middleware/validateRequest';
import { orderValidation } from './order.validation';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.interface';

const router = express.Router();

// Verify payment
router.get(
  '/verify',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  orderController.verifyPayment,
);

// Order routes
//router.post('/', auth(USER_ROLE.user), orderController.createOrder);
router.post(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  validateRequest(orderValidation.createOrderZodSchema),
  orderController.createOrder,
);

// Create order from cart route
router.post(
  '/from-cart',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  validateRequest(orderValidation.createOrderFromCartZodSchema),
  orderController.createOrderFromCart,
);

//router.post('/', auth(USER_ROLE.user), orderController.createOrder);
router.get(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  orderController.getOrders,
);

// Get user's orders - new route for users to see their own orders
router.get(
  '/my-orders',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  orderController.getUserOrders,
);

router.get(
  '/details',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  orderController.getDetails,
);
// Get revenue
router.get('/revenue', auth(USER_ROLE.admin), orderController.getRevenue);

// Tracking routes
// Public tracking route - accessible without authentication
router.get(
  '/tracking/:trackingNumber',
  orderController.getOrderByTrackingNumber,
);

// Protected tracking routes - require authentication
router.get(
  '/track/id/:orderId',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  orderController.getOrderById,
);

// Admin-only tracking management routes
router.patch(
  '/track/:orderId',
  auth(USER_ROLE.admin),
  orderController.updateOrderTracking,
);
router.patch(
  '/track/:orderId/number',
  auth(USER_ROLE.admin),
  orderController.assignTrackingNumber,
);
router.patch(
  '/track/:orderId/delivery-date',
  auth(USER_ROLE.admin),
  orderController.setEstimatedDelivery,
);

// provider delete route
router.delete(
  '/:orderId',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.deleteOrder,
);

// Get user's orders
router.get(
  '/user/orders',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.getUserOrders,
);

// Get provider's orders - orders containing meals from this provider
router.get(
  '/provider/orders',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.getProviderOrders,
);

// Get orders for a specific provider by providerId (for admin use)
router.get(
  '/provider/:providerId/orders',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.getOrdersByProviderId,
);

// Test route for email (temporary)
router.get('/test-email', orderController.sendTestEmail);

// Test route for sending email to a real order
router.get(
  '/send-order-email/:orderId',
  auth(USER_ROLE.admin),
  orderController.sendOrderEmail,
);

// Test route for sending provider notifications for an order
router.get(
  '/send-provider-notifications/:orderId',
  auth(USER_ROLE.admin),
  orderController.sendProviderNotifications,
);

// Get order by ID
router.get(
  '/:orderId',
  auth(USER_ROLE.admin, USER_ROLE.customer, USER_ROLE.provider),
  orderController.getOrderById,
);

// Update order tracking (admin only)
router.patch(
  '/:orderId/tracking',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  validateRequest(orderValidation.updateTrackingZodSchema),
  orderController.updateOrderTracking,
);

// Assign tracking number (admin only)
router.patch(
  '/:orderId/assign-tracking',
  auth('admin'),
  validateRequest(orderValidation.assignTrackingZodSchema),
  orderController.assignTrackingNumber,
);

// Set estimated delivery date (admin only)
router.patch(
  '/:orderId/estimated-delivery',
  auth('admin'),
  validateRequest(orderValidation.setEstimatedDeliveryZodSchema),
  orderController.setEstimatedDelivery,
);

// Delete order (admin only)
router.delete('/:orderId', auth('admin'), orderController.deleteOrder);

export const orderRoutes = router;
