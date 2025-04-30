import express, { NextFunction, Request, Response, RequestHandler } from 'express';
import { MealMenuControllers } from './mealMenu.controller';
import { MealMenuValidation } from './mealMenu.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { upload } from '../../utils/sendImageCloudinary';
import { sendImageToCloudinary } from '../../utils/sendImageCloudinary';
import { MealMenuServices } from './mealMenu.service';
import httpStatus from 'http-status';

// Let's check if there's a proper way to import these in the existing code
// For now, we'll use a simple solution that should work for this example
interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Record<string, unknown>;
}

const sendResponse = (res: Response, data: ApiResponse) => {
  res.status(data.statusCode).json(data);
};

enum ENUM_USER_ROLE {
  ADMIN = 'admin',
  USER = 'user',
  PROVIDER = 'provider',
  CUSTOMER = 'customer',
}

const router = express.Router();

// 1. Create a Meal Menu
router.post(
  '/',
  auth(ENUM_USER_ROLE.PROVIDER),
  (req: Request, res: Response, next: NextFunction) => {
    console.log(
      'Incoming request for meal menu creation with body:',
      req.body,
    );
    next();
  },
  upload.single('file'),
  ((req, res, next) => {
    try {
      // Parse JSON data if it exists
      if (req.body.data && typeof req.body.data === 'string') {
        try {
          const parsedData = JSON.parse(req.body.data);
          // Merge parsed data into req.body
          req.body = { ...parsedData };
          console.log('Successfully parsed JSON data');
        } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          res.status(400).json({
            success: false,
            message: 'Invalid JSON format in data field',
            error: parseError instanceof Error ? parseError.message : 'JSON parse error',
          });
          return;
        }
      }

      // Check if there is a file
      if (req.file) {
        console.log('File received:', req.file);
        // Upload image to cloudinary
        const imageName = req.body.name || 'untitled_meal';
        const imagePath = req.file.path;
        sendImageToCloudinary(imageName, imagePath)
          .then(({ secure_url }) => {
            req.body.image = secure_url;
            next();
          })
          .catch(error => {
            next(error);
          });
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
  validateRequest(MealMenuValidation.mealMenuValidationSchema),
  MealMenuControllers.createMealMenu,
);

// 2. Get All Meal Menus
router.get('/', MealMenuControllers.getMealMenus);

// 7. Get Provider Menus by Email
router.get(
  '/provider-menus',
  auth(ENUM_USER_ROLE.PROVIDER),
  MealMenuControllers.getProviderMenusByEmail
);

// 4. Get Provider's Meal Menus by ID
router.get('/provider/:providerId', MealMenuControllers.getProviderMealMenus);

// 3. Get a Specific Meal Menu
router.get('/:id', MealMenuControllers.getSpecificMealMenu);

// 5. Delete a Meal Menu
router.delete('/:id', auth(ENUM_USER_ROLE.PROVIDER), MealMenuControllers.deleteMealMenu);

// 6. Update a Meal Menu
router.patch(
  '/:id',
  auth(ENUM_USER_ROLE.PROVIDER),
  (req: Request, res: Response, next: NextFunction) => {
    console.log(
      'Incoming request for meal menu update with body:',
      req.body,
    );
    next();
  },
  upload.single('file'),
  ((req, res, next) => {
    try {
      // Parse JSON data if it exists
      if (req.body.data && typeof req.body.data === 'string') {
        try {
          const parsedData = JSON.parse(req.body.data);
          // Merge parsed data into req.body
          req.body = { ...parsedData };
          console.log('Successfully parsed JSON data');
        } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          res.status(400).json({
            success: false,
            message: 'Invalid JSON format in data field',
            error: parseError instanceof Error ? parseError.message : 'JSON parse error',
          });
          return;
        }
      }

      // Check if there is a file
      if (req.file) {
        console.log('File received:', req.file);
        // Upload image to cloudinary
        const imageName = req.body.name || `meal_${req.params.id}`;
        const imagePath = req.file.path;
        sendImageToCloudinary(imageName, imagePath)
          .then(({ secure_url }) => {
            req.body.image = secure_url;
            next();
          })
          .catch(error => {
            next(error);
          });
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
  validateRequest(MealMenuValidation.mealMenuUpdateValidationSchema),
  MealMenuControllers.updateMealMenu,
);

// Rate a meal
router.post(
  '/:id/ratings',
  auth(ENUM_USER_ROLE.CUSTOMER, ENUM_USER_ROLE.PROVIDER),
  validateRequest(MealMenuValidation.ratingValidationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const userName = req.user?.name;
      const { rating, comment } = req.body;

      const result = await MealMenuServices.addMealRating(
        id,
        userId,
        rating,
        comment,
        userName
      );

      const currentDate = new Date();

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Meal rating added successfully',
        data: {
          ...result.toObject(),
          reviewDate: currentDate,
          customerName: userName
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update meal quantity
router.patch(
  '/:id/quantity',
  auth(ENUM_USER_ROLE.PROVIDER),
  validateRequest(MealMenuValidation.quantityValidationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const result = await MealMenuServices.updateMealQuantity(id, quantity);

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Meal quantity updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const MealMenuRoutes = router; 