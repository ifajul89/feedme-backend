import { sendImageToCloudinary } from '../../utils/sendImageCloudinary';
import { TCar } from './car.interface';
import { CarModel } from './car.modle';

// 1. Create a Car
const createCarInDB = async (car: TCar) => {
  try {
    console.log('Creating car in DB with:', {
      name: car?.name,
      hasImage: !!car.image,
    });

    // Verify image URL is present
    if (!car.image) {
      throw new Error('Image URL is required');
    }

    // Verify it's actually a URL
    if (!car.image.startsWith('http')) {
      throw new Error('Invalid image URL format');
    }

    // Create car in database
    console.log('Creating car in database');
    const result = await CarModel.create(car);
    console.log('Car created with ID:', result._id);
    return result;
  } catch (error) {
    console.error('Error in createCarInDB:', error);
    throw error;
  }
};

// 2. Get All Cars
const getAllCarsFromDb = async (query: Record<string, unknown>) => {
  const searchableFields = ['name', 'model', 'brand', 'category'];
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
  const searchQuery = CarModel.find({
    $or: searchableFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: 'i' },
    })),
  });

  // Filtering
  const filterQuery = searchQuery.find(queryObj);

  // Pagination
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10000;
  // // skip = (page-1)*limit
  const skip = (page - 1) * limit;

  // // const result = await filterQuery.skip(skip).limit(limit)
  const paginatedQuery = filterQuery.skip(skip).limit(limit);

  let sortStr;

  if (query?.sortBy && query?.sortOrder) {
    const sortBy = query?.sortBy;
    const sortOrder = query?.sortOrder;
    // "-price" or "price"
    sortStr = `${sortOrder === 'desc' ? '-' : ''}${sortBy}`;
  }

  const sortQuery = paginatedQuery.sort(sortStr);

  let fields = '-__v';

  if (query?.fields) {
    fields = (query.fields as string)?.split(',').join(' ');
  }

  const result = await sortQuery.select(fields);

  // Get total count for metadata
  const total = await CarModel.countDocuments();

  return {
    data: result,
    meta: {
      page,
      limit,
      total,
    },
  };
};

// 3. Get a Specific Car
const getSpecificCar = async (id: string) => {
  const result = await CarModel.findById(id);
  return result;
};

// 4. Update a Car
const updateCar = async (id: string, data: Partial<TCar>) => {
  try {
    // If a file path or base64 data is provided, upload to cloudinary
    if (
      data.image &&
      typeof data.image === 'string' &&
      (data.image.startsWith('data:') || !data.image.startsWith('http'))
    ) {
      const imageName = data?.name || `car_${id}`;
      const imageSource = data.image;
      const { secure_url } = await sendImageToCloudinary(
        imageName,
        imageSource,
      );
      data.image = secure_url as string;
    }

    // Use runValidators to ensure the update data meets validation criteria
    const result = await CarModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!result) {
      throw new Error(`Car with id ${id} not found`);
    }

    return result;
  } catch (error) {
    console.error('Error updating car:', error);
    throw error;
  }
};

// 5. Delete a Car
const deleteCar = async (id: string) => {
  const result = await CarModel.findByIdAndDelete(id);
  return result;
};

export const CarServices = {
  createCarInDB,
  getAllCarsFromDb,
  getSpecificCar,
  updateCar,
  deleteCar,
};
