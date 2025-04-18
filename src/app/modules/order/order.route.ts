import express from 'express';
import { orderController } from './order.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.interface';
// import validateRequest from '../../middleware/validateRequest';
// import orderValidation from './order.validation';

const router = express.Router();

// Verify payment
router.get(
  '/verify',
  auth(USER_ROLE.admin, USER_ROLE.user),
  orderController.verifyPayment,
);

// Order routes
//router.post('/', auth(USER_ROLE.user), orderController.createOrder);
router.post(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.user),
  orderController.createOrder,
);
//router.post('/', auth(USER_ROLE.user), orderController.createOrder);
router.get(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.user),
  orderController.getOrders,
);

// Get user's orders - new route for users to see their own orders
router.get('/my-orders', auth(USER_ROLE.user), orderController.getUserOrders);

router.get(
  '/details',
  auth(USER_ROLE.admin, USER_ROLE.user),
  orderController.getDetails,
);
// Get revenue
router.get('/revenue', auth(USER_ROLE.admin), orderController.getRevenue);

// Tracking routes
// Public tracking route - accessible without authentication
router.get('/track/:trackingNumber', orderController.trackOrderByNumber);

// Protected tracking routes - require authentication
router.get(
  '/track/id/:orderId',
  auth(USER_ROLE.admin, USER_ROLE.user),
  orderController.trackOrderById,
);

// Admin-only tracking management routes
router.patch(
  '/track/:orderId',
  auth(USER_ROLE.admin),
  orderController.updateTracking,
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

// Admin-only delete route
router.delete('/:orderId', auth(USER_ROLE.admin), orderController.deleteOrder);

export const orderRoutes = router;
