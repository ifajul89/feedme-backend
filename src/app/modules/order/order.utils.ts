/* eslint-disable @typescript-eslint/no-explicit-any */
import Shurjopay from 'shurjopay';
import config from '../../config';

// Create a new instance of ShurjoPay
const shurjopay = new Shurjopay();

// Configure ShurjoPay with credentials - use uppercase env var names
shurjopay.config(
  config.SP.sp_endpoint!,
  config.SP.sp_username!,
  config.SP.sp_password!,
  config.SP.sp_prefix!,
  config.SP.sp_return_url!,
);

// Log configuration details

// Define ShurjoPay response types
interface PaymentResponse {
  checkout_url: string;
  amount: number;
  currency: string;
  sp_order_id: string;
  customer_order_id: string;
  customer_name: string;
  customer_address: string;
  customer_city: string;
  customer_phone: string;
  customer_email: string;
  client_ip: string;
  intent: string;
  transactionStatus: string;
  status?: string;
  msg?: string;
  message?: string;
  bank_status?: string;
  sp_code?: string;
  sp_message?: string;
  [key: string]: any; // For any other properties
}

interface VerificationResponse {
  id?: string;
  order_id?: string;
  currency?: string;
  amount?: number;
  payable_amount?: number;
  discount_amount?: number;
  disc_percent?: number;
  received_amount?: number;
  usd_amt?: number;
  usd_rate?: number;
  card_holder_name?: string;
  card_number?: string;
  phone_no?: string;
  bank_status?: string;
  transaction_status?: string;
  transaction_time?: string;
  bank_trx_id?: string;
  invoice_no?: string;
  sp_code?: string;
  sp_message?: string;
  message?: string;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  value1?: string;
  value2?: string;
  value3?: string;
  value4?: string;
  [key: string]: any; // For any other properties
}

const makePaymentAsync = async (
  paymentPayload: any,
): Promise<PaymentResponse> => {
  return new Promise((resolve, reject) => {
    shurjopay.makePayment(
      paymentPayload,
      (response: any) => {
        resolve(response);
      },
      (error: any) => {
        reject(error);
      },
    );
  });
};

const verifyPaymentAsync = async (
  order_id: string,
): Promise<VerificationResponse> => {
  return new Promise((resolve, reject) => {
    shurjopay.verifyPayment(
      order_id,
      (response) => {
        resolve(response);
      },
      (error) => {
        reject(error);
      },
    );
  });
};

// Helper function to generate HTML email template for order confirmation
const generateOrderConfirmationEmail = (order: any) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `৳${amount.toFixed(2)}`;
  };

  // Generate items HTML - handle both meals and products
  let itemsHtml = '';

  // Check if order has meals (from schema) or products (from some validation)
  const items = order.meals || order.products || [];

  items.forEach((item: any) => {
    // Get product/meal name - handle different structures
    let itemName = 'Item';

    // Handle meal structure
    if (item.mealId) {
      if (typeof item.mealId === 'object') {
        itemName = item.mealId.name || 'Meal';
      } else {
        itemName = 'Meal';
      }
    }
    // Handle product structure
    else if (item.product) {
      if (typeof item.product === 'object') {
        itemName = item.product.name || 'Product';
      } else {
        itemName = 'Product';
      }
    }

    itemsHtml += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${itemName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price || 0)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal || item.price * item.quantity || 0)}</td>
      </tr>
    `;
  });

  // Email template
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Order Confirmation</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Preheader text (shows in email client previews) -->
    <div style="display: none; max-height: 0px; overflow: hidden;">
      Your order #${order.trackingNumber} has been confirmed and is being prepared!
    </div>
    <!-- End preheader text -->
    
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border-top: 4px solid #4CAF50;">
      <h1 style="color: #4CAF50; margin-top: 0;">Order Confirmed!</h1>
      <p>Dear ${order.name},</p>
      <p>Thank you for your order. We're preparing your delicious meals right now!</p>
      
      <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
        <h2 style="margin-top: 0; color: #444; font-size: 18px;">Order Summary</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Payment Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Paid</span></p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(order.subtotal || 0)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Tax:</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(order.tax || 0)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Shipping:</td>
              <td style="padding: 12px; text-align: right;">${formatCurrency(order.shipping || 0)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; color: #4CAF50;">${formatCurrency(order.totalPrice || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
        <h2 style="margin-top: 0; color: #444; font-size: 18px;">Delivery Information</h2>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>City:</strong> ${order.city}${order.zipCode ? ', ' + order.zipCode : ''}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Email:</strong> ${order.email}</p>
      </div>
      
      <div style="background-color: #fff; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #eee; text-align: center;">
        <a href="https://feedme.com/track/${order.trackingNumber}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Track Your Order</a>
      </div>
      
      <p>You can track your order using your tracking number: <strong>${order.trackingNumber}</strong></p>
      <p>If you have any questions about your order, please contact our customer service team.</p>
      
      <p style="margin-top: 30px;">Thank you for choosing FeedMe!</p>
      <p style="margin-bottom: 0;">The FeedMe Team</p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
      <p>&copy; ${new Date().getFullYear()} FeedMe. All rights reserved.</p>
      <p>FeedMe Ltd., 123 Food Street, Dhaka, Bangladesh</p>
      <p>You're receiving this email because you placed an order on FeedMe.</p>
      <p>To unsubscribe from promotional emails, <a href="https://feedme.com/unsubscribe?email=${order.email}" style="color: #4CAF50;">click here</a>.</p>
    </div>
  </body>
  </html>
  `;
};

const generateProviderOrderNotificationEmail = (
  order: any,
  providerMeals: any[],
) => {
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `৳${amount.toFixed(2)}`;
  };

  // Format the provider's meals in the order
  const itemsHtml = providerMeals
    .map((meal) => {
      return `
      <tr>
        <td style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">
          ${meal.mealId.name}
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">
          ${meal.quantity}
        </td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          ${formatCurrency(meal.price)}
        </td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          ${formatCurrency(meal.subtotal)}
        </td>
      </tr>
    `;
    })
    .join('');

  // Calculate total for this provider
  const providerTotal = providerMeals.reduce(
    (sum, meal) => sum + meal.subtotal,
    0,
  );

  // Email template
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>New Order Notification</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Preheader text (shows in email client previews) -->
    <div style="display: none; max-height: 0px; overflow: hidden;">
      New order received - Order #${order.trackingNumber} requires your attention
    </div>
    <!-- End preheader text -->
    
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border-top: 4px solid #4CAF50;">
      <h1 style="color: #4CAF50; margin-top: 0;">New Order Received!</h1>
      <p>You have received a new order that includes your meals.</p>
      
      <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
        <h2 style="margin-top: 0; color: #444; font-size: 18px;">Order Details</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Customer Name:</strong> ${order.name}</p>
        <p><strong>Payment Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Paid</span></p>
        
        <h3 style="margin-top: 20px; color: #444; font-size: 16px;">Your Meals in This Order:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">Your Total:</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px; color: #4CAF50;">${formatCurrency(providerTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #eee;">
        <h2 style="margin-top: 0; color: #444; font-size: 18px;">Delivery Information</h2>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>City:</strong> ${order.city}${order.zipCode ? ', ' + order.zipCode : ''}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Email:</strong> ${order.email}</p>
      </div>
      
      <p>Please prepare the meals for delivery. You can track this order using the tracking number: <strong>${order.trackingNumber}</strong></p>
      
      <div style="background-color: #fff; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #eee; text-align: center;">
        <a href="https://feedme.com/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">View Order Details</a>
      </div>
      
      <p style="margin-top: 30px;">Thank you for your partnership with FeedMe!</p>
      <p style="margin-bottom: 0;">The FeedMe Team</p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
      <p>&copy; ${new Date().getFullYear()} FeedMe. All rights reserved.</p>
      <p>FeedMe Ltd., 123 Food Street, Dhaka, Bangladesh</p>
      <p>You're receiving this email because you're a registered food provider on FeedMe.</p>
      <p>To update your notification preferences, <a href="https://feedme.com/provider/settings" style="color: #4CAF50;">click here</a>.</p>
    </div>
  </body>
  </html>
  `;
};

export const orderUtils = {
  makePaymentAsync,
  verifyPaymentAsync,
  generateOrderConfirmationEmail,
  generateProviderOrderNotificationEmail,
};

//shurjopay.makePayment()

// console.log(shurjopay);

// const makePaymentAsync = async (
//     paymentPayload: any
// ): Promise<PaymentResponse> => {
//     return new Promise((resolve, reject) => {
//         shurjopay.makePayment(
//             paymentPayload,
//             (response) => resolve(response),
//             (error) => reject(error)
//         );
//     });
// };

// const verifyPaymentAsync = (
//     order_id: string
// ): Promise<VerificationResponse[]> => {
//     return new Promise((resolve, reject) => {
//         shurjopay.verifyPayment(
//             order_id,
//             (response) => resolve(response),
//             (error) => reject(error)
//         );
//     });
// };
