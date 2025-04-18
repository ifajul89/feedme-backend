import { Router, Request, Response } from 'express';
import { CarRoutes } from '../modules/car/car.route';
import { orderRoutes } from '../modules/order/order.route';
import authRoute from '../modules/Auth/auth.route';
import { userRoutes } from '../modules/user/user.route';
import { upload } from '../utils/sendImageCloudinary';
import { sendImageToCloudinary } from '../utils/sendImageCloudinary';

const router = Router();

// More robust test route for file uploads
router.post('/test-upload', (req: Request, res: Response) => {
  console.log(
    'Test upload route hit with content-type:',
    req.headers['content-type'],
  );

  // Use our custom error-handling wrapper for multer
  const singleUpload = upload.single('file');

  singleUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message,
      });
    }

    try {
      console.log('Request body:', req.body);
      console.log(
        'File:',
        req.file
          ? {
              mimetype: req.file.mimetype,
              size: req.file.size,
              fieldname: req.file.fieldname,
              buffer: !!req.file.buffer,
            }
          : 'No file',
      );

      // If we have a file, try to upload it to Cloudinary
      let imageUrl = null;
      if (req.file) {
        try {
          // Create image source based on storage type
          let imageSource;
          if (req.file.buffer) {
            // Memory storage (Vercel/production)
            imageSource = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
          } else if (req.file.path) {
            // Disk storage (local development)
            imageSource = req.file.path;
          } else {
            throw new Error('No valid file data found');
          }

          // Upload to Cloudinary
          const cloudinaryResult = await sendImageToCloudinary(
            'test-upload',
            imageSource,
          );
          imageUrl = cloudinaryResult.secure_url;
          console.log('Image uploaded to Cloudinary:', imageUrl);
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

      // Send successful response
      res.json({
        success: true,
        message: 'File upload test successful',
        body: req.body,
        file: req.file
          ? {
              mimetype: req.file.mimetype,
              size: req.file.size,
              fieldname: req.file.fieldname,
            }
          : null,
        imageUrl,
      });
    } catch (error: unknown) {
      console.error('Error in test-upload route:', error);
      res.status(500).json({
        success: false,
        message: 'Server error processing upload',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
});

const modelRouters = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/cars',
    route: CarRoutes,
  },
  {
    path: '/orders',
    route: orderRoutes,
  },
  {
    path: '/user',
    route: userRoutes,
  },
];

modelRouters.forEach((route) => router.use(route.path, route.route));

export default router;
