import { sendImageToCloudinary } from '../../utils/sendImageCloudinary';
import { TMealMenu } from './mealMenu.interface';
import { MealMenuModel } from './mealMenu.model';

// 1. Create a Meal Menu
const createMealMenuInDB = async (mealMenu: TMealMenu) => {
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
    console.log('Meal menu created with ID:', result._id);
    return result;
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
  });

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
    const result = await MealMenuModel.findById(id);
    
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
const updateMealMenu = async (id: string, data: Partial<TMealMenu>) => {
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
    );

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
  const result = await MealMenuModel.find({ providerId });
  return result;
};

export const MealMenuServices = {
  createMealMenuInDB,
  getAllMealMenusFromDb,
  getSpecificMealMenu,
  updateMealMenu,
  deleteMealMenu,
  getProviderMealMenus,
}; 