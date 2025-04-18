/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { CarServices } from './car.service';

// 1. Create a Car
const createCar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(
        'In createCar controller - body keys:',
        Object.keys(req.body),
      );

      // At this point, image should already be processed and in Cloudinary
      // and available as req.body.image
      if (!req.body.image) {
        console.warn('No image URL found in request body');
      }

      // Create car record
      const result = await CarServices.createCarInDB(req.body);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        status: true,
        message: 'Car is created successfully',
        data: result,
      });
    } catch (error: unknown) {
      console.error('Error in createCar controller:', error);
      next(error);
    }
  },
);
// 2. Get All Cars
const getCars = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CarServices.getAllCarsFromDb(req.query);
    // console.log(result);
    // console.log(req.cookies);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Car are retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
    // res.send(result)
  },
);
// 3. Get a Specific Car
const getSpecificCar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await CarServices.getSpecificCar(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Car is retrieved successfully',
      data: result,
    });
  },
);
// 5. Delete a Car
const deleteCar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await CarServices.deleteCar(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Car is deleted successfully!',
      data: result,
    });
  },
);

// 4. Update a Car
const updateCar = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    // Check if ID is provided
    if (!id) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        status: false,
        message: 'Car ID is required',
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

    const result = await CarServices.updateCar(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      status: true,
      message: 'Car is updated successfully',
      data: result,
    });
  },
);

export const CarControllers = {
  createCar,
  getCars,
  getSpecificCar,
  updateCar,
  deleteCar,
};
