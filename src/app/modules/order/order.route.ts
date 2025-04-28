import express from 'express';
import { orderController } from './order.controller';
import validateRequest from '../../middleware/validateRequest';
import { orderValidation } from './order.validation';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.interface';
import { orderUtils } from './order.utils';
import nodemailer from 'nodemailer';
import config from '../../config';
import { OrderModel } from './order.model';
import { orderService } from './order.service';
// import validateRequest from '../../middleware/validateRequest';
// import orderValidation from './order.validation';

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
router.get('/my-orders', auth(USER_ROLE.admin, USER_ROLE.customer), orderController.getUserOrders);

router.get(
  '/details',
  auth(USER_ROLE.admin, USER_ROLE.customer),
  orderController.getDetails,
);
// Get revenue
router.get('/revenue', auth(USER_ROLE.admin), orderController.getRevenue);

// Tracking routes
// Public tracking route - accessible without authentication
router.get('/tracking/:trackingNumber', orderController.getOrderByTrackingNumber);

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
router.delete('/:orderId', auth(USER_ROLE.admin, USER_ROLE.provider), orderController.deleteOrder);

// Get user's orders
router.get(
  '/user/orders',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.getUserOrders
);

// Get provider's orders - orders containing meals from this provider
router.get(
  '/provider/orders',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.getProviderOrders
);

// Get orders for a specific provider by providerId (for admin use)
router.get(
  '/provider/:providerId/orders',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  orderController.getOrdersByProviderId
);

// Test route for email (temporary)
router.get(
  '/test-email',
  async (req: Request, res: Response) => {
    try {
      // Create simple test order data
      const testOrder = {
        _id: 'test-order-123',
        name: 'Test Customer',
        email: req.query.email || 'test@example.com',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        zipCode: '12345',
        totalPrice: 1000,
        subtotal: 850,
        tax: 50,
        shipping: 100,
        trackingNumber: 'TEST-TRK-12345',
        createdAt: new Date(),
        products: [
          {
            product: { name: 'Test Product' },
            quantity: 2,
            price: 425,
            subtotal: 850
          }
        ]
      };

      // Generate email HTML
      const emailHtml = orderUtils.generateOrderConfirmationEmail(testOrder);

      // Send test email
      const result = await sendEmail({
        email: req.query.email?.toString() || 'test@example.com',
        subject: 'FeedMe - Test Order Confirmation',
        html: emailHtml
      });

      console.log('Test email result:', result);

      res.status(200).json({
        status: true,
        message: 'Test email sent successfully',
        data: {
          messageId: result.messageId,
          to: req.query.email || 'test@example.com'
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Test email failed:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to send test email',
        error: errorMessage
      });
    }
  }
);

// Test route for sending email to a real order
router.get(
  '/send-order-email/:orderId',
  async (req: Request, res: Response) => {
    try {
      const orderId = req.params.orderId;
      const targetEmail = req.query.email?.toString();
      
      // Get the order with populated meals (NOT products)
      const order = await OrderModel.findById(orderId).populate({
        path: 'meals.mealId', // This is the correct path according to the schema
        select: 'name price image'
      });
      
      if (!order) {
        return res.status(404).json({
          status: false,
          message: 'Order not found'
        });
      }
      
      console.log('Found order:', {
        id: order._id,
        email: order.email,
        targetEmail: targetEmail,
        meals: order.meals?.length || 0 // Use 'meals' instead of 'products'
      });
      
      // Generate the email HTML
      const emailHtml = orderUtils.generateOrderConfirmationEmail(order);
      
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: Number(config.EMAIL_PORT),
        secure: config.EMAIL_PORT === '465',
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS,
        },
        // Add these options for better deliverability
        tls: {
          rejectUnauthorized: false
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      });
      
      // Send email - use provided email or fall back to order email
      const mailTo = targetEmail || order.email;
      
      console.log('Sending email to:', mailTo);
      
      const mailResult = await transporter.sendMail({
        from: {
          name: "FeedMe Order Confirmation",
          address: config.EMAIL_USER || 'noreply@feedme.com'
        },
        to: mailTo,
        subject: `FeedMe - Order Confirmation #${order.trackingNumber}`,
        html: emailHtml,
        headers: {
          'X-Priority': '1',
          'Importance': 'high',
          'X-MSMail-Priority': 'High',
          'Precedence': 'bulk'
        },
        text: `Thank you for your order #${order.trackingNumber}! We're preparing your delicious meals right now. You can track your order using your tracking number.`
      });
      
      const messageId = mailResult?.messageId || 'No message ID';
      console.log('Email sent result:', {messageId});
      
      res.status(200).json({
        status: true,
        message: 'Order confirmation email sent successfully',
        data: {
          orderId: order._id,
          to: mailTo,
          messageId: messageId
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send order email:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to send order email',
        error: errorMessage
      });
    }
  }
);

// Test route for sending provider notifications for an order
router.get(
  '/send-provider-notifications/:orderId',
  auth(USER_ROLE.admin),
  async (req: Request, res: Response) => {
    try {
      const orderId = req.params.orderId;
      
      console.log('Manually sending provider notifications for order:', orderId);
      
      // Call the provider notification service
      await orderService.sendProviderOrderNotifications(orderId);
      
      res.status(200).json({
        status: true,
        message: 'Provider notifications sent successfully',
        data: {
          orderId: orderId
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send provider notifications:', error);
      res.status(500).json({
        status: false,
        message: 'Failed to send provider notifications',
        error: errorMessage
      });
    }
  }
);

// Get order by ID
router.get(
  '/:orderId',
  auth(USER_ROLE.admin, USER_ROLE.customer, USER_ROLE.provider),
  orderController.getOrderById
);

// Update order tracking (admin only)
router.patch(
  '/:orderId/tracking',
  auth(USER_ROLE.admin, USER_ROLE.provider),
  validateRequest(orderValidation.updateTrackingZodSchema),
  orderController.updateOrderTracking
);

// Assign tracking number (admin only)
router.patch(
  '/:orderId/assign-tracking',
  auth('admin'),
  validateRequest(orderValidation.assignTrackingZodSchema),
  orderController.assignTrackingNumber
);

// Set estimated delivery date (admin only)
router.patch(
  '/:orderId/estimated-delivery',
  auth('admin'),
  validateRequest(orderValidation.setEstimatedDeliveryZodSchema),
  orderController.setEstimatedDelivery
);

// Delete order (admin only)
router.delete(
  '/:orderId',
  auth('admin'),
  orderController.deleteOrder
);

export const orderRoutes = router;
