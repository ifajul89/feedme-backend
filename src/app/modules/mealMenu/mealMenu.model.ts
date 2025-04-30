import { Schema, model, models } from 'mongoose';
import { MealTypes } from './mealMenu.interface';

// Create the Mongoose schema
const mealMenuSchema = new Schema<MealTypes['TMealMenu']>({
  name: { type: String, required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ingredients: [{ type: String, required: true }],
  portionSize: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  category: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'],
    required: true,
  },
  description: { type: String, required: true },
  preparationTime: { type: Number, required: true },
  isAvailable: { type: Boolean, required: true },
  quantity: { type: Number, default: 0 }, // Available quantity of the meal
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    reviews: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      date: { type: Date, default: Date.now },
      customerName: { type: String }
    }]
  },
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fat: { type: Number },
  },
  customizationOptions: {
    removeIngredients: [{ type: String }],
    addOns: [{
      name: { type: String },
      price: { type: Number }
    }],
    spiceLevel: [{ type: String }],
    noteToChef: { type: Boolean }
  }
});

// Create and export the model, checking if it already exists
export const MealMenuModel = models.MealMenu || model<MealTypes['TMealMenu']>('MealMenu', mealMenuSchema); 