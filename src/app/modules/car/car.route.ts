import express, { NextFunction, Request, Response } from 'express';
import { CarControllers } from './car.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.interface';
import validateRequest from '../../middleware/validateRequest';
import {
  carValidationSchema,
  carUpdateValidationSchema,
} from './car.validation';
import { upload } from '../../utils/sendImageCloudinary';
import { sendImageToCloudinary } from '../../utils/sendImageCloudinary';
const router = express.Router();

// Direct handler for car creation with file upload
router.post(
  '/',
  auth(USER_ROLE.admin),
  (req: Request, res: Response, next: NextFunction) => {
    console.log(
      'Post car endpoint hit with content-type:',
      req.headers['content-type'],
    );

    // Use custom error handling for upload
    const singleUpload = upload.single('file');
    singleUpload(req, res, async (uploadErr) => {
      if (uploadErr) {
        console.error('Multer upload error:', uploadErr);
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: uploadErr.message,
        });
      }

      try {
        console.log('File upload successful, processing data');
        console.log('Body keys:', Object.keys(req.body));
        console.log('File present:', !!req.file);

        // Parse JSON data if it exists
        if (req.body.data && typeof req.body.data === 'string') {
          try {
            req.body = JSON.parse(req.body.data);
            console.log('Successfully parsed JSON data');
          } catch (parseError: unknown) {
            console.error('Error parsing JSON data:', parseError);
            return res.status(400).json({
              success: false,
              message: 'Invalid JSON format in data field',
              error:
                parseError instanceof Error
                  ? parseError.message
                  : 'JSON parse error',
            });
          }
        }

        // Process file if present
        if (req.file) {
          console.log('Processing file:', req.file.fieldname);

          // Create image source based on storage type
          let imageSource;
          if (req.file.buffer) {
            // Memory storage (Vercel/production)
            imageSource = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            console.log('Created base64 from buffer');
          } else if (req.file.path) {
            // Disk storage (local development)
            imageSource = req.file.path;
            console.log('Using file path:', req.file.path);
          } else {
            return res.status(400).json({
              success: false,
              message: 'No valid file data found',
            });
          }

          try {
            // Upload to Cloudinary directly
            const imageName = req.body.name || 'untitled_car';
            const { secure_url } = await sendImageToCloudinary(
              imageName,
              imageSource,
            );
            console.log('Image uploaded to Cloudinary:', secure_url);

            // Add the image URL to the body
            req.body.image = secure_url;
          } catch (cloudinaryError: unknown) {
            console.error('Cloudinary upload error:', cloudinaryError);
            return res.status(500).json({
              success: false,
              message: 'Cloudinary upload failed',
              error:
                cloudinaryError instanceof Error
                  ? cloudinaryError.message
                  : 'Unknown error',
            });
          }
        }

        // Validate the body data
        const validationResult = carValidationSchema.safeParse({
          body: req.body,
        });
        if (!validationResult.success) {
          console.error('Validation error:', validationResult.error);
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.errors,
          });
        }

        // Forward to controller
        next();
      } catch (error: unknown) {
        console.error('General error in car creation:', error);
        res.status(500).json({
          success: false,
          message: 'Server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  },
  CarControllers.createCar,
);

// 2. Get All Cars
router.get('/', CarControllers.getCars);

// 3. Get a Specific Car
router.get('/:id', CarControllers.getSpecificCar);

// 4. Delete a Car
router.delete('/:id', auth(USER_ROLE.admin), CarControllers.deleteCar);

// 5. Update a Car
router.patch(
  '/:id',
  auth(USER_ROLE.admin),
  (req: Request, res: Response, next: NextFunction) => {
    console.log(
      'Update car endpoint hit with content-type:',
      req.headers['content-type'],
    );

    // Use custom error handling for upload
    const singleUpload = upload.single('file');
    singleUpload(req, res, async (uploadErr) => {
      if (uploadErr) {
        console.error('Multer upload error:', uploadErr);
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: uploadErr.message,
        });
      }

      try {
        console.log('File upload successful, processing data');
        console.log('Body keys:', Object.keys(req.body));
        console.log('File present:', !!req.file);

        // Parse JSON data if it exists
        if (req.body.data && typeof req.body.data === 'string') {
          try {
            req.body = JSON.parse(req.body.data);
            console.log('Successfully parsed JSON data');
          } catch (parseError: unknown) {
            console.error('Error parsing JSON data:', parseError);
            return res.status(400).json({
              success: false,
              message: 'Invalid JSON format in data field',
              error:
                parseError instanceof Error
                  ? parseError.message
                  : 'JSON parse error',
            });
          }
        }

        // Process file if present
        if (req.file) {
          console.log('Processing file:', req.file.fieldname);

          // Create image source based on storage type
          let imageSource;
          if (req.file.buffer) {
            // Memory storage (Vercel/production)
            imageSource = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            console.log('Created base64 from buffer');
          } else if (req.file.path) {
            // Disk storage (local development)
            imageSource = req.file.path;
            console.log('Using file path:', req.file.path);
          } else {
            return res.status(400).json({
              success: false,
              message: 'No valid file data found',
            });
          }

          try {
            // Upload to Cloudinary directly
            const imageName = req.body.name || `car_${req.params.id}`;
            const { secure_url } = await sendImageToCloudinary(
              imageName,
              imageSource,
            );
            console.log('Image uploaded to Cloudinary:', secure_url);

            // Add the image URL to the body
            req.body.image = secure_url;
          } catch (cloudinaryError: unknown) {
            console.error('Cloudinary upload error:', cloudinaryError);
            return res.status(500).json({
              success: false,
              message: 'Cloudinary upload failed',
              error:
                cloudinaryError instanceof Error
                  ? cloudinaryError.message
                  : 'Unknown error',
            });
          }
        }

        // Validate the body data for update
        const validationResult = carUpdateValidationSchema.safeParse({
          body: req.body,
        });
        if (!validationResult.success) {
          console.error('Validation error:', validationResult.error);
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.errors,
          });
        }

        // Forward to controller
        next();
      } catch (error: unknown) {
        console.error('General error in car update:', error);
        res.status(500).json({
          success: false,
          message: 'Server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  },
  CarControllers.updateCar,
);

export const CarRoutes = router;
