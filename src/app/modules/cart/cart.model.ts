import { Schema, model } from 'mongoose';
import { ICart } from './cart.interface';

const cartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: false,
  },
  items: [{
    mealId: {
      type: Schema.Types.ObjectId,
      ref: 'Meal',
      required: true,
    },
    mealName: {
      type: String,
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    providerEmail: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    deliverySlot: {
      type: String,
      required: true,
    },
    customization: {
      spiceLevel: {
        type: String,
        required: false,
      },
      removedIngredients: [{
        type: String,
      }],
      addOns: [{
        name: {
          type: String,
          required: false,
        },
        price: {
          type: Number,
          required: true,
        },
      }],
      specialInstructions: {
        type: String,
      },
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Create a unique index on userId with sparse option
// The sparse option ensures that documents without a userId field are not indexed
cartSchema.index(
  { userId: 1 }, 
  { 
    unique: true,
    sparse: true
  }
);

// Pre-save middleware to validate userId
cartSchema.pre('save', function(next) {
  if (!this.userId) {
    const error = new Error('userId is required and cannot be null');
    return next(error);
  }
  next();
});

export const Cart = model<ICart>('Cart', cartSchema); 