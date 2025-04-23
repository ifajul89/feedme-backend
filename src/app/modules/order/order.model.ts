import { model, Schema } from 'mongoose';
import { TOrder } from './order.interface';

const OrderSchema = new Schema<TOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerFirstName: {
      type: String,
      required: true,
    },
    customerLastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    deliveryDate: {
      type: Date,
      required: true
    },
    deliverySlot: {
      type: String,
      required: true
    },
    meals: [
      {
        mealId: {
          type: Schema.Types.ObjectId,
          ref: 'MealMenu',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          required: true,
        },
        customization: {
          spiceLevel: String,
          removedIngredients: [String],
          addOns: [{
            name: String,
            price: Number
          }],
          specialInstructions: String
        }
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    shipping: {
      type: Number,
      required: true,
      default: 250,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    trackingStages: {
      placed: {
        type: Boolean,
        default: true,
      },
      approved: {
        type: Boolean,
        default: false,
      },
      processed: {
        type: Boolean,
        default: false,
      },
      shipped: {
        type: Boolean,
        default: false,
      },
      delivered: {
        type: Boolean,
        default: false,
      },
    },
    trackingUpdates: [
      {
        stage: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        message: {
          type: String,
          required: true,
        },
      },
    ],
    trackingNumber: {
      type: String,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    transaction: {
      id: String,
      transactionStatus: String,
      bank_status: String,
      sp_code: String,
      sp_message: String,
      method: String,
      date_time: String,
    },
  },
  {
    timestamps: true,
  },
);

export const OrderModel = model<TOrder>('Order', OrderSchema);
