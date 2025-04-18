/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { orderService } from './order.service';
const createOrder = catchAsync(async (req, res) => {
  const user = req.user;

  // Check if required customer information is present in the request body
  const {
    customerFirstName,
    customerLastName,
    email,
    phone,
    address,
    city,
    zipCode,
    products,
  } = req.body;

  if (
    !customerFirstName ||
    !customerLastName ||
    !email ||
    !phone ||
    !address ||
    !city ||
    !zipCode
  ) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Missing required customer information',
      data: null,
    });
  }

  // Verify products array is not empty
  if (!products || !Array.isArray(products) || products.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Order must contain at least one product',
      data: null,
    });
  }

  // Verify each product has valid ID and quantity
  for (const product of products) {
    if (!product.product || !product.quantity || product.quantity <= 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Each product must have a valid ID and quantity',
        data: null,
      });
    }
  }

  const result = await orderService.createOrder(user, req.body, req.ip!);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Order placed successfully',
    data: result,
  });
});

// verify order
const verifyPayment = catchAsync(async (req, res) => {
  const order = await orderService.verifyPayment(req.query.order_id as string);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Order verified successfully',
    data: order,
  });
});
// get order
const getOrders = catchAsync(async (req, res) => {
  const order = await orderService.getOrders();

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Order retrieved successfully',
    data: order,
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

// Add tracking-related controller functions
const trackOrderByNumber = catchAsync(async (req: Request, res: Response) => {
  const { trackingNumber } = req.params;

  const order = await orderService.getOrderByTrackingNumber(trackingNumber);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order tracking information retrieved successfully',
    data: order,
  });
});

const trackOrderById = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order tracking information retrieved successfully',
    data: order,
  });
});

const updateTracking = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { stage, message, estimatedDeliveryDate } = req.body;

  if (!stage || !message) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      status: false,
      message: 'Stage and message are required for tracking update',
      data: null,
    });
  }

  const order = await orderService.updateOrderTracking(orderId, {
    stage,
    message,
    estimatedDeliveryDate,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order tracking updated successfully',
    data: order,
  });
});

const assignTrackingNumber = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { trackingNumber } = req.body;

  if (!trackingNumber) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      status: false,
      message: 'Tracking number is required',
      data: null,
    });
  }

  const order = await orderService.assignTrackingNumber(
    orderId,
    trackingNumber,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Tracking number assigned successfully',
    data: order,
  });
});

const setEstimatedDelivery = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { estimatedDeliveryDate } = req.body;

  if (!estimatedDeliveryDate) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      status: false,
      message: 'Estimated delivery date is required',
      data: null,
    });
  }

  const order = await orderService.setEstimatedDelivery(
    orderId,
    new Date(estimatedDeliveryDate),
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Estimated delivery date set successfully',
    data: order,
  });
});

// Add function to get orders for the current logged in user
const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user?._id) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      status: false,
      message: 'User not authenticated or missing ID',
      data: null,
    });
  }

  const orders = await orderService.getUserOrders(user._id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'User orders retrieved successfully',
    data: orders,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!orderId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      status: false,
      message: 'Order ID is required',
      data: null,
    });
  }

  const result = await orderService.deleteOrder(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order deleted successfully',
    data: result,
  });
});

export const orderController = {
  createOrder,
  getRevenue,
  getDetails,
  verifyPayment,
  getOrders,
  trackOrderByNumber,
  trackOrderById,
  updateTracking,
  assignTrackingNumber,
  setEstimatedDelivery,
  getUserOrders,
  deleteOrder,
};
