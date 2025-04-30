import { z } from 'zod';

// Create order validation schema
const createOrderZodSchema = z.object({
  body: z.object({
    products: z.array(
      z.object({
        product: z.string(),
        quantity: z.number().min(1),
        price: z.number().optional(),
      })
    ),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    zipCode: z.string(),
  }),
});

// Create order from cart validation schema
const createOrderFromCartZodSchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string().optional(),
    city: z.string(),
    zipCode: z.string(),
    deliveryDate: z.string().transform((date) => new Date(date)),
    deliverySlot: z.string()
  }),
});

// Verify payment validation schema
const verifyPaymentZodSchema = z.object({
  body: z.object({
    order_id: z.string(),
  }),
});

// Update tracking validation schema
const updateTrackingZodSchema = z.object({
  body: z.object({
    stage: z.enum(['placed', 'approved', 'processed', 'shipped', 'delivered']),
    message: z.string(),
  }),
});

// Assign tracking number validation schema
const assignTrackingZodSchema = z.object({
  body: z.object({
    trackingNumber: z.string(),
  }),
});

// Set estimated delivery validation schema
const setEstimatedDeliveryZodSchema = z.object({
  body: z.object({
    estimatedDeliveryDate: z.string(),
  }),
});

export const orderValidation = {
  createOrderZodSchema,
  createOrderFromCartZodSchema,
  verifyPaymentZodSchema,
  updateTrackingZodSchema,
  assignTrackingZodSchema,
  setEstimatedDeliveryZodSchema,
};
