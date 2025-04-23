/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { orderService } from './order.service';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.createOrder(req.user, req.body, req.ip || '0.0.0.0');
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    status: true,
    message: 'Order created successfully',
    data: result,
  });
});

const createOrderFromCart = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.createOrderFromCart(req.user, req.body, req.ip || '0.0.0.0');
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    status: true,
    message: 'Order created from cart successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.verifyPayment(req.body.order_id);
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

const getOrderByTrackingNumber = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.getOrderByTrackingNumber(req.params.trackingNumber);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

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
  const providerId = req.user?._id || "68050ff04ae9fabbfaecd9a0"; // Using a hardcoded ID as fallback for testing
  
  const result = await orderService.getProviderOrders(providerId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Provider orders retrieved successfully',
    data: result,
  });
});

const getOrdersByProviderId = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.params.providerId;
  console.log('Getting orders for provider ID from params:', providerId);
  
  const result = await orderService.getProviderOrders(providerId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Provider orders retrieved successfully',
    data: result,
  });
});

const updateOrderTracking = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.updateOrderTracking(req.params.orderId, {
    stage: req.body.stage,
    message: req.body.message
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Order tracking updated successfully',
    data: result,
  });
});

const assignTrackingNumber = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.assignTrackingNumber(req.params.orderId, req.body.trackingNumber);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    status: true,
    message: 'Tracking number assigned successfully',
    data: result,
  });
});

const setEstimatedDelivery = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.setEstimatedDelivery(req.params.orderId, new Date(req.body.estimatedDeliveryDate));
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
};
