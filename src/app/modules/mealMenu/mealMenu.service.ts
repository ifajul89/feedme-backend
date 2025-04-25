import { sendImageToCloudinary } from '../../utils/sendImageCloudinary';
import { MealTypes } from './mealMenu.interface';
import { MealMenuModel } from './mealMenu.model';
import mongoose from 'mongoose';

// 1. Create a Meal Menu
const createMealMenuInDB = async (mealMenu: MealTypes['TMealMenu']) => {
  try {
    console.log('Creating meal menu in DB with:', {
      name: mealMenu?.name,
      hasImage: !!mealMenu.image,
    });

    // Verify image URL is present if provided
    if (mealMenu.image && !mealMenu.image.startsWith('http')) {
      throw new Error('Invalid image URL format');
    }

    // Create meal menu in database
    console.log('Creating meal menu in database');
    const result = await MealMenuModel.create(mealMenu);
    
    // Populate the provider information after creation
    const populatedResult = await MealMenuModel.findById(result._id).populate('providerId', 'name email');
    
    console.log('Meal menu created with ID:', result._id);
    return populatedResult;
  } catch (error) {
    console.error('Error in createMealMenuInDB:', error);
    throw error;
  }
};

// 2. Get All Meal Menus
const getAllMealMenusFromDb = async (query: Record<string, unknown>) => {
  const searchableFields = ['name', 'category', 'ingredients'];
  const queryObj = { ...query };

  const excludingImportant = [
    'searchTerm',
    'page',
    'limit',
    'sortOrder',
    'sortBy',
    'fields',
  ];
  // what field don't need to filtering
  excludingImportant.forEach((key) => delete queryObj[key]);

  const searchTerm = query?.searchTerm || '';
  const searchQuery = MealMenuModel.find({
    $or: searchableFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: 'i' },
    })),
  }).populate('providerId', 'name email'); // Populate provider information

  // Filtering
  const filterQuery = searchQuery.find(queryObj);

  // Pagination
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10000;
  const skip = (page - 1) * limit;

  const paginatedQuery = filterQuery.skip(skip).limit(limit);

  let sortStr;
  if (query?.sortBy && query?.sortOrder) {
    const sortBy = query?.sortBy;
    const sortOrder = query?.sortOrder;
    sortStr = `${sortOrder === 'desc' ? '-' : ''}${sortBy}`;
  }

  const sortQuery = paginatedQuery.sort(sortStr);

  let fields = '-__v';
  if (query?.fields) {
    fields = (query.fields as string)?.split(',').join(' ');
  }

  const result = await sortQuery.select(fields);

  // Get total count for metadata
  const total = await MealMenuModel.countDocuments();

  return {
    data: result,
    meta: {
      page,
      limit,
      total,
    },
  };
};

// 3. Get a Specific Meal Menu
const getSpecificMealMenu = async (id: string) => {
  try {
    console.log('Attempting to find meal menu with ID:', id);
    const result = await MealMenuModel.findById(id).populate('providerId', 'name email');
    
    if (!result) {
      console.log('No meal menu found with ID:', id);
      throw new Error(`Meal menu with id ${id} not found`);
    }
    
    console.log('Found meal menu:', result);
    return result;
  } catch (error) {
    console.error('Error in getSpecificMealMenu:', error);
    throw error;
  }
};

// 4. Update a Meal Menu
const updateMealMenu = async (id: string, data: Partial<MealTypes['TMealMenu']>) => {
  try {
    // If a file path or base64 data is provided, upload to cloudinary
    if (
      data.image &&
      typeof data.image === 'string' &&
      (data.image.startsWith('data:') || !data.image.startsWith('http'))
    ) {
      const imageName = data?.name || `meal_${id}`;
      const imageSource = data.image;
      const { secure_url } = await sendImageToCloudinary(
        imageName,
        imageSource,
      );
      data.image = secure_url as string;
    }

    // Use runValidators to ensure the update data meets validation criteria
    const result = await MealMenuModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('providerId', 'name email');

    if (!result) {
      throw new Error(`Meal menu with id ${id} not found`);
    }

    return result;
  } catch (error) {
    console.error('Error updating meal menu:', error);
    throw error;
  }
};

// 5. Delete a Meal Menu
const deleteMealMenu = async (id: string) => {
  const result = await MealMenuModel.findByIdAndDelete(id);
  return result;
};

// 6. Get Provider's Meal Menus
const getProviderMealMenus = async (providerId: string) => {
  const result = await MealMenuModel.find({ providerId }).populate('providerId', 'name email');
  return result;
};

// Search Meals with Advanced Filters
const searchMeals = async (searchParams: {
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  providerId?: string;
  isAvailable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) => {
  const {
    searchTerm,
    category,
    minPrice,
    maxPrice,
    providerId,
    isAvailable,
    sortBy = 'price',
    sortOrder = 'asc',
    page = 1,
    limit = 12,
  } = searchParams;

  // Build the query
  const query: {
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    category?: string;
    price?: { $gte?: number; $lte?: number };
    providerId?: string;
    isAvailable?: boolean;
  } = {};

  // Only apply filters if they are provided
  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }

  if (providerId) {
    query.providerId = providerId;
  }

  if (typeof isAvailable === 'boolean') {
    query.isAvailable = isAvailable;
  }

  // Build sort object
  const sortOptions: Record<string, 1 | -1> = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const meals = await MealMenuModel.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate('providerId', 'name email'); // Populate provider details

  // Get total count for pagination
  const total = await MealMenuModel.countDocuments(query);

  return {
    data: meals,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Add a rating to a meal
const addMealRating = async (
  mealId: string,
  userId: string,
  rating: number,
  comment?: string,
  userName?: string
) => {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Find the meal
    const meal = await MealMenuModel.findById(mealId);
    if (!meal) {
      throw new Error(`Meal with id ${mealId} not found`);
    }

    // Get current date and time
    const currentDate = new Date();

    // Check if user has already reviewed this meal
    const existingReviewIndex = meal.ratings?.reviews?.findIndex(
      (review: { userId: mongoose.Types.ObjectId | string }) => review.userId.toString() === userId
    );

    if (existingReviewIndex !== undefined && existingReviewIndex >= 0) {
      // Update existing review
      if (meal.ratings && meal.ratings.reviews) {
        meal.ratings.reviews[existingReviewIndex].rating = rating;
        if (comment) {
          meal.ratings.reviews[existingReviewIndex].comment = comment;
        }
        meal.ratings.reviews[existingReviewIndex].date = currentDate;
        // Store customer name if provided
        if (userName) {
          meal.ratings.reviews[existingReviewIndex].customerName = userName;
        }
      }
    } else {
      // Add new review
      if (!meal.ratings) {
        meal.ratings = { average: 0, count: 0, reviews: [] };
      }
      
      meal.ratings.reviews?.push({
        userId,
        rating,
        comment,
        date: currentDate,
        customerName: userName
      });
      
      // Increment count
      meal.ratings.count = (meal.ratings.reviews?.length || 0);
    }

    // Recalculate average rating
    if (meal.ratings && meal.ratings.reviews) {
      const totalRating = meal.ratings.reviews.reduce(
        (sum: number, review: { rating: number }) => sum + review.rating,
        0
      );
      meal.ratings.average = totalRating / meal.ratings.reviews.length;
    }

    // Save the updated meal
    await meal.save();

    // Return the updated meal with populated provider
    return MealMenuModel.findById(mealId).populate('providerId', 'name email');
  } catch (error) {
    console.error('Error adding meal rating:', error);
    throw error;
  }
};

// Update meal quantity
const updateMealQuantity = async (mealId: string, quantity: number) => {
  try {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    
    const result = await MealMenuModel.findByIdAndUpdate(
      mealId,
      { quantity },
      { new: true, runValidators: true }
    ).populate('providerId', 'name email');
    
    if (!result) {
      throw new Error(`Meal with id ${mealId} not found`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating meal quantity:', error);
    throw error;
  }
};

// New function to get provider menus by email
const getProviderMenusByEmail = async (email: string) => {
  // First, find the provider by email
  const UserModel = mongoose.model('User');
  const provider = await UserModel.findOne({ email });
  
  if (!provider) {
    throw new Error(`Provider with email ${email} not found`);
  }
  
  console.log('Found provider:', provider._id);
  
  // Then find all menus created by this provider
  // Convert the ID to string for proper comparison
  const result = await MealMenuModel.find({ 
    providerId: provider._id 
  }).populate('providerId', 'name email');
  
  console.log(`Found ${result.length} menus for provider with email: ${email}`);
  
  return result;
};

export const MealMenuServices = {
  createMealMenuInDB,
  getAllMealMenusFromDb,
  getSpecificMealMenu,
  updateMealMenu,
  deleteMealMenu,
  getProviderMealMenus,
  searchMeals,
  addMealRating,
  updateMealQuantity,
  getProviderMenusByEmail,
}; 