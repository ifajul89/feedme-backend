import { NextFunction, Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { MealMenuServices } from './mealMenu.service';

// 1. Create a Meal Menu
const createMealMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(
        'In createMealMenu controller - body keys:',
        Object.keys(req.body),
      );

      // At this point, image should already be processed and in Cloudinary
      // and available as req.body.image
      if (!req.body.image) {
        console.warn('No image URL found in request body');
      }

      // Set the providerId from the authenticated user
      req.body.providerId = req.user._id;

      // Create meal menu record
      const result = await MealMenuServices.createMealMenuInDB(req.body);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Meal menu is created successfully',
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error in createMealMenu controller:', error);
      next(error);
    }
  },
);

// 2. Get All Meal Menus
const getMealMenus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await MealMenuServices.getAllMealMenusFromDb(req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Meal menus are retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

// 3. Get a Specific Meal Menu
const getSpecificMealMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await MealMenuServices.getSpecificMealMenu(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Meal menu is retrieved successfully',
      data: result,
    });
  },
);

// 4. Delete a Meal Menu
const deleteMealMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await MealMenuServices.deleteMealMenu(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Meal menu is deleted successfully!',
      data: result,
    });
  },
);

// 5. Update a Meal Menu
const updateMealMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    // Check if ID is provided
    if (!id) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        status: false,
        message: 'Meal menu ID is required',
        data: null,
      });
    }

    // Check if request body is empty
    if (Object.keys(req.body).length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        status: false,
        message: 'No update data provided',
        data: null,
      });
    }

    const result = await MealMenuServices.updateMealMenu(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Meal menu is updated successfully',
      data: result,
    });
  },
);

// 6. Get Provider's Meal Menus
const getProviderMealMenus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const providerId = req.params.providerId;
    const result = await MealMenuServices.getProviderMealMenus(providerId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Provider meal menus are retrieved successfully',
      data: result,
    });
  },
);

export const MealMenuControllers = {
  createMealMenu,
  getMealMenus,
  getSpecificMealMenu,
  updateMealMenu,
  deleteMealMenu,
  getProviderMealMenus,
}; 