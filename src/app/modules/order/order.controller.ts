/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { orderService } from './order.service';
import sendEmail from '../../utils/sendEmail';
import { orderUtils } from './order.utils';
import nodemailer from 'nodemailer';
import config from '../../config';
import { OrderModel } from './order.model';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.createOrder(
    req.user,
    req.body,
    req.ip || '0.0.0.0',
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    status: true,
    message: 'Order created successfully',
    data: result,
  });
});

const createOrderFromCart = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.createOrderFromCart(
    req.user,
    req.body,
    req.ip || '0.0.0.0',
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    status: true,
    message: 'Order created from cart successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  // Get order_id from query parameters for GET request
  const order_id =
    (req.query.order_id as string) || (req.body.order_id as string);

  if (!order_id) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      status: false,
      message: 'Order ID is required',
      data: null,
    });
    return;
  }

  const result = await orderService.verifyPayment(order_id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Payment verified successfully',
    data: result,
  });
});

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.getOrders();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

const getOrderByTrackingNumber = catchAsync(
  async (req: Request, res: Response) => {
    const result = await orderService.getOrderByTrackingNumber(
      req.params.trackingNumber,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Order retrieved successfully',
      data: result,
    });
  },
);

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.getOrderById(req.params.orderId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.getUserOrders(req.user?._id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'User orders retrieved successfully',
    data: result,
  });
});

const getProviderOrders = catchAsync(async (req: Request, res: Response) => {
  console.log('Provider ID from user object:', req.user?._id);

  // Use the user ID from the token or a hardcoded ID for testing
  const providerId = req.user?._id || '68050ff04ae9fabbfaecd9a0'; // Using a hardcoded ID as fallback for testing

  const result = await orderService.getProviderOrders(providerId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Provider orders retrieved successfully',
    data: result,
  });
});

const getOrdersByProviderId = catchAsync(
  async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    console.log('Getting orders for provider ID from params:', providerId);

    const result = await orderService.getProviderOrders(providerId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Provider orders retrieved successfully',
      data: result,
    });
  },
);

const updateOrderTracking = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.updateOrderTracking(req.params.orderId, {
    stage: req.body.stage,
    message: req.body.message,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order tracking updated successfully',
    data: result,
  });
});

const assignTrackingNumber = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.assignTrackingNumber(
    req.params.orderId,
    req.body.trackingNumber,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Tracking number assigned successfully',
    data: result,
  });
});

const setEstimatedDelivery = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.setEstimatedDelivery(
    req.params.orderId,
    new Date(req.body.estimatedDeliveryDate),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Estimated delivery date set successfully',
    data: result,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.deleteOrder(req.params.orderId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order deleted successfully',
    data: result,
  });
});

const getRevenue = catchAsync(
  async (_req: Request, res: Response, next: NextFunction) => {
    const totalRevenue = await orderService.calculateRevenue();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Total revenue is get successfully',
      data: totalRevenue,
    });
  },
);

const getDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const is
    const details = await orderService.getDetails();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Order details is get successfully',
      data: details,
    });
  },
);

const sendTestEmail = catchAsync(async (req: Request, res: Response) => {
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
        subtotal: 850,
      },
    ],
  };

  // Generate email HTML
  const emailHtml = orderUtils.generateOrderConfirmationEmail(testOrder);

  // Send test email
  const result = await sendEmail({
    email: req.query.email?.toString() || 'test@example.com',
    subject: 'FeedMe - Test Order Confirmation',
    html: emailHtml,
  });

  console.log('Test email result:', result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Test email sent successfully',
    data: {
      messageId: result.messageId,
      to: req.query.email || 'test@example.com',
    },
  });
});

const sendOrderEmail = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const targetEmail = req.query.email?.toString();

  // Get the order with populated meals (NOT products)
  const order = await OrderModel.findById(orderId).populate({
    path: 'meals.mealId', // This is the correct path according to the schema
    select: 'name price image',
  });

  if (!order) {
    sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      status: false,
      message: 'Order not found',
      data: null,
    });
    return;
  }

  console.log('Found order:', {
    id: order._id,
    email: order.email,
    targetEmail: targetEmail,
    meals: order.meals?.length || 0, // Use 'meals' instead of 'products'
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
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  // Send email - use provided email or fall back to order email
  const mailTo = targetEmail || order.email;

  console.log('Sending email to:', mailTo);

  const mailResult = await transporter.sendMail({
    from: {
      name: 'FeedMe Order Confirmation',
      address: config.EMAIL_USER || 'noreply@feedme.com',
    },
    to: mailTo,
    subject: `FeedMe - Order Confirmation #${order.trackingNumber}`,
    html: emailHtml,
    headers: {
      'X-Priority': '1',
      Importance: 'high',
      'X-MSMail-Priority': 'High',
      Precedence: 'bulk',
    },
    text: `Thank you for your order #${order.trackingNumber}! We're preparing your delicious meals right now. You can track your order using your tracking number.`,
  });

  const messageId = mailResult?.messageId || 'No message ID';
  console.log('Email sent result:', { messageId });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order confirmation email sent successfully',
    data: {
      orderId: order._id,
      to: mailTo,
      messageId: messageId,
    },
  });
});

const sendProviderNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const orderId = req.params.orderId;

    console.log('Manually sending provider notifications for order:', orderId);

    // Call the provider notification service
    await orderService.sendProviderOrderNotifications(orderId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Provider notifications sent successfully',
      data: {
        orderId: orderId,
      },
    });
  },
);

export const orderController = {
  createOrder,
  createOrderFromCart,
  verifyPayment,
  getOrders,
  getOrderByTrackingNumber,
  getOrderById,
  getUserOrders,
  getProviderOrders,
  getOrdersByProviderId,
  updateOrderTracking,
  assignTrackingNumber,
  setEstimatedDelivery,
  deleteOrder,
  getRevenue,
  getDetails,
  sendTestEmail,
  sendOrderEmail,
  sendProviderNotifications,
};
