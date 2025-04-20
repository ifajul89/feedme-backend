import { Schema, model, models } from 'mongoose';
import { MealTypes } from './mealMenu.interface';

// Create the Mongoose schema
const mealMenuSchema = new Schema<MealTypes['TMealMenu']>({
  name: { type: String, required: true },
  providerId: { type: String, required: true },
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