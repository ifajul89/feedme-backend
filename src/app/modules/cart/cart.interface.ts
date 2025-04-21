import { Types } from 'mongoose';

export interface ICart {
  userId: Types.ObjectId;
  customerName: string;
  customerId: Types.ObjectId;
  customerEmail?: string;
  items: {
    mealId: Types.ObjectId;
    mealName: string;
    providerId: Types.ObjectId;
    providerName: string;
    providerEmail?: string;
    quantity: number;
    price: number;
    deliveryDate: Date;
    deliverySlot: string;
    customization: {
      spiceLevel?: 'Mild' | 'Medium' | 'Hot';
      removedIngredients?: string[];
      addOns?: {
        name: string;
        price: number;
      }[];
      specialInstructions?: string;
    };
  }[];
  totalAmount: number;
  deliveryAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
} 