/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { CarModel } from '../car/car.modle';
import { OrderModel } from './order.model';
import { orderUtils } from './order.utils';

// const createOrder = async (user: TUser, orderData: any, client_ip: string) => {

//   const { userId, carId, quantity, price, status } = orderData;
//   console.log(orderData);
//   console.log(user._id);

//   const carData = await CarModel.findById(carId);

//   if (!carData) {
//     throw new Error('Car not found.');
//   }

//   if (carData.quantity < quantity) {
//     throw new Error('This car is out of stock!');
//   }
//   // Reduces car stock quantity when order.
//   carData.quantity = carData.quantity - quantity;
//   // Checks if the stock is greater than 0, then sets the inStock property to true, otherwise false.
//   carData.inStock = carData.quantity > 0;

//   await carData.save();
//   // Product Details
//   const productDetails = {
//     userId,
//     carId,
//     status,
//     quantity,
//     price,
//     totalPrice: Number(quantity * price)
//   };

//   // let order = await Order.create({
//   //   user,
//   //   products: productDetails,
//   //   totalPrice,
//   // });

//   const totalPrice = Number(quantity * price)
//   // console.log(productDetails, "To");
//   let order = await OrderModel.create(productDetails);
//   // payment integration
//   const shurjopayPayload = {
//     amount: totalPrice,
//     order_id: order._id,
//     currency: "BDT",
//     customer_name: user.name,
//     customer_address: user.address,
//     customer_email: user.email,
//     customer_phone: user.phone,
//     customer_city: user.city,
//     client_ip,
//   };

//   const payment = await orderUtils.makePaymentAsync(shurjopayPayload);

//   if (payment?.transactionStatus) {
//     order = await order.updateOne({
//       transaction: {
//         id: payment.sp_order_id,
//         transactionStatus: payment.transactionStatus,
//       },
//     });
//   }

//   return { paymentInfo: payment.checkout_url, payment };
// };

// verify payment

const createOrder = async (
  user: any,
  payload: {
    products: { product: string; quantity: number; price?: number }[];
    customerFirstName: string;
    customerLastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  },
  client_ip: string,
) => {
  if (!payload?.products?.length)
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Order is not specified');

  const products = payload.products;

  // Set fixed shipping cost
  const shippingCost = 2500;

  let subtotal = 0;
  const productDetails = await Promise.all(
    products.map(async (item) => {
      const product = await CarModel.findById(item.product);
      if (!product) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          `Product with ID ${item.product} not found`,
        );
      }

      // Use the product price from the database
      const price = product.price || 0;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      return {
        product: item.product,
        quantity: item.quantity,
        price: price,
        subtotal: itemSubtotal,
      };
    }),
  );

  // Verify we have valid product details before proceeding
  if (!productDetails.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No valid products found for this order',
    );
  }

  // Calculate tax (5% of subtotal)
  const taxRate = 0.05;
  const tax = subtotal * taxRate;

  // Calculate total price (subtotal + tax + shipping)
  const totalPrice = subtotal + tax + shippingCost;

  // Generate a unique tracking number
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const trackingNumber = `TRK-${timestamp}-${randomStr}`;

  // Create initial tracking update
  const initialTrackingUpdate = {
    stage: 'placed',
    timestamp: new Date(),
    message: 'Order has been placed successfully',
  };

  // Calculate estimated delivery date (1 week from now)
  // const estimatedDeliveryDate = new Date();
  // estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

  const order = await OrderModel.create({
    user,
    customerFirstName: payload.customerFirstName,
    customerLastName: payload.customerLastName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    zipCode: payload.zipCode,
    products: productDetails,
    subtotal,
    tax,
    shipping: shippingCost,
    totalPrice,
    trackingNumber, // Add tracking number
    trackingUpdates: [initialTrackingUpdate], // Add initial tracking update
    // estimatedDeliveryDate // Add estimated delivery date
  });

  // Double-check the created order has products
  if (!order.products || order.products.length === 0) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to save products to the order',
    );
  }

  // payment integration
  const shurjopayPayload = {
    amount: totalPrice,
    order_id: order._id,
    currency: 'BDT',
    customer_name: `${payload.customerFirstName} ${payload.customerLastName}`,
    customer_address: payload.address,
    customer_email: payload.email,
    customer_phone: payload.phone,
    customer_city: payload.city,
    client_ip,
  };

  const payment = await orderUtils.makePaymentAsync(shurjopayPayload);

  if (payment?.transactionStatus) {
    await OrderModel.updateOne(
      { _id: order._id },
      {
        transaction: {
          id: payment.sp_order_id,
          transactionStatus: payment.transactionStatus,
        },
      },
    );
  }

  // Return both payment URL and order details including tracking number
  return {
    checkoutUrl: payment.checkout_url,
    order: {
      orderId: order._id,
      trackingNumber: order.trackingNumber,
      totalPrice: order.totalPrice,
      status: order.status,
      // estimatedDeliveryDate: order.estimatedDeliveryDate
    },
  };
};

//   const payment = await orderUtils.makePaymentAsync(shurjopayPayload);

//   if (payment?.transactionStatus) {
//     order = await order.updateOne({
//       transaction: {
//         id: payment.sp_order_id,
//         transactionStatus: payment.transactionStatus,
//       },
//     });
//   }

//   return payment.checkout_url;
// };

const verifyPayment = async (order_id: string) => {
  const verifiedPayment = await orderUtils.verifyPaymentAsync(order_id);
  if (verifiedPayment.length) {
    const bankStatus = verifiedPayment[0].bank_status;
    const isCancelled = bankStatus === 'Cancel';
    const isPaid = bankStatus === 'Success';
    const isBankStatusNull = !bankStatus || bankStatus === null;

    const updateData: any = {
      'transaction.bank_status': bankStatus,
      'transaction.sp_code': verifiedPayment[0].sp_code,
      'transaction.sp_message': verifiedPayment[0].sp_message,
      'transaction.transaction_status': verifiedPayment[0].transaction_status,
      'transaction.date_time': verifiedPayment[0].date_time,
      status:
        bankStatus === 'Success'
          ? 'Paid'
          : bankStatus === 'Failed'
            ? 'Pending'
            : bankStatus === 'Cancel'
              ? 'Cancelled'
              : '',
    };

    // If order is cancelled or bank status is null, clear estimated delivery date
    if (isCancelled || isBankStatusNull) {
      updateData.estimatedDeliveryDate = undefined;
    }

    // If order is paid, set estimated delivery date to 7 days from now
    if (isPaid) {
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);
      updateData.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    await OrderModel.findOneAndUpdate(
      { 'transaction.id': order_id },
      updateData,
    );
  }

  return verifiedPayment;
};

const getOrders = async () => {
  const data = await OrderModel.find();
  return data;
};

const calculateRevenue = async () => {
  const result = await OrderModel.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  return result[0]?.totalRevenue || 0;
};

const getDetails = async () => {
  const result = await OrderModel.find();
  // console.log(result, "From order service");
  return result;
};

// Add these tracking-related services at the end of the file
const getOrderByTrackingNumber = async (trackingNumber: string) => {
  const order = await OrderModel.findOne({ trackingNumber }).populate({
    path: 'products.product',
    model: 'Car',
  });

  if (!order) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Order not found with this tracking number',
    );
  }
  return order;
};

const getOrderById = async (orderId: string) => {
  const order = await OrderModel.findById(orderId).populate({
    path: 'products.product',
    model: 'Car',
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }
  return order;
};

const updateOrderTracking = async (
  orderId: string,
  trackingData: {
    stage: 'placed' | 'approved' | 'processed' | 'shipped' | 'delivered';
    message: string;
    estimatedDeliveryDate?: string | Date;
  },
) => {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Update tracking stages - ensure all previous stages are also set to true
  if (trackingData.stage === 'placed') {
    order.trackingStages.placed = true;
  } else if (trackingData.stage === 'approved') {
    order.trackingStages.placed = true;
    order.trackingStages.approved = true;
  } else if (trackingData.stage === 'processed') {
    order.trackingStages.placed = true;
    order.trackingStages.approved = true;
    order.trackingStages.processed = true;
  } else if (trackingData.stage === 'shipped') {
    order.trackingStages.placed = true;
    order.trackingStages.approved = true;
    order.trackingStages.processed = true;
    order.trackingStages.shipped = true;
  } else if (trackingData.stage === 'delivered') {
    order.trackingStages.placed = true;
    order.trackingStages.approved = true;
    order.trackingStages.processed = true;
    order.trackingStages.shipped = true;
    order.trackingStages.delivered = true;
  }

  // Add tracking update
  order.trackingUpdates.push({
    stage: trackingData.stage,
    timestamp: new Date(),
    message: trackingData.message,
  });

  // Update order status based on tracking stage
  if (trackingData.stage === 'shipped') {
    order.status = 'Shipped';
  } else if (trackingData.stage === 'delivered') {
    order.status = 'Completed';
  }

  // Check if order status is Cancelled
  if (order.status === 'Cancelled') {
    // If cancelled, set estimated delivery date to undefined
    order.estimatedDeliveryDate = undefined;
  } else {
    // Otherwise, set estimated delivery date if provided
    if (trackingData.estimatedDeliveryDate) {
      order.estimatedDeliveryDate = new Date(
        trackingData.estimatedDeliveryDate,
      );
    }
  }

  await order.save();
  return order;
};

const assignTrackingNumber = async (
  orderId: string,
  trackingNumber: string,
) => {
  const order = await OrderModel.findByIdAndUpdate(
    orderId,
    { trackingNumber },
    { new: true },
  );

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return order;
};

const setEstimatedDelivery = async (
  orderId: string,
  estimatedDeliveryDate: Date,
) => {
  const order = await OrderModel.findByIdAndUpdate(
    orderId,
    { estimatedDeliveryDate },
    { new: true },
  );

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return order;
};

// Add function to get orders for a specific user
const getUserOrders = async (userId: string) => {
  const orders = await OrderModel.find({ user: userId })
    .populate({
      path: 'products.product',
      model: 'Car',
    })
    .select('-trackingStages') // Exclude trackingStages from the response
    .sort({ createdAt: -1 });

  return orders;
};

const deleteOrder = async (orderId: string) => {
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  await OrderModel.findByIdAndDelete(orderId);

  return { message: 'Order deleted successfully' };
};

// Export the tracking services
export const orderService = {
  createOrder,
  verifyPayment,
  getOrders,
  calculateRevenue,
  getDetails,
  getOrderByTrackingNumber,
  getOrderById,
  updateOrderTracking,
  assignTrackingNumber,
  setEstimatedDelivery,
  getUserOrders,
  deleteOrder,
};
