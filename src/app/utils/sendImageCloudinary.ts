import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import multer from 'multer';
import config from '../config';

// Configure Cloudinary with proper error handling
try {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
} catch (error) {
  console.error('Failed to configure cloudinary:', error);
}

export const sendImageToCloudinary = (
  imageName: string,
  imageSource: string,
): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging requests
    const timeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timed out after 30 seconds'));
    }, 30000);

    try {
      console.log(
        `Uploading image to Cloudinary: ${imageName && imageName.substring(0, 20)}...`,
      );

      // Add more logging around the upload process
      cloudinary.uploader.upload(
        imageSource,
        {
          public_id: (imageName || 'unnamed').trim(),
          resource_type: 'auto',
        },
        function (error, result) {
          clearTimeout(timeout);

          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
            return;
          }

          if (!result) {
            console.error('Cloudinary returned no result');
            reject(new Error('No result from Cloudinary'));
            return;
          }

          console.log('Image uploaded successfully to Cloudinary');
          resolve(result as UploadApiResponse);

          // In serverless environment, we don't need to delete the file if it's base64 data
          // Only delete if it's a physical file on disk
          if (
            imageSource &&
            !imageSource.startsWith('data:') &&
            fs.existsSync(imageSource)
          ) {
            fs.unlink(imageSource, (err) => {
              if (err) {
                console.log('Error deleting file:', err);
              } else {
                console.log('Local file deleted successfully');
              }
            });
          }
        },
      );
    } catch (uploadError) {
      clearTimeout(timeout);
      console.error('Error in Cloudinary upload process:', uploadError);
      reject(uploadError);
    }
  });
};

// Check environment
const isProduction =
  process.env.NODE_ENVIRONMENT === 'production' || process.env.VERCEL;
console.log('Environment:', process.env.NODE_ENVIRONMENT);
console.log('Using memory storage:', isProduction);

// Updated storage configuration
const storage = isProduction
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        // Ensure uploads directory exists
        try {
          const uploadsDir = process.cwd() + '/uploads/';
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        } catch (error: unknown) {
          console.error('Error creating uploads directory:', error);
          cb(
            error instanceof Error
              ? error
              : new Error('Unknown error creating directory'),
            process.cwd(),
          );
        }
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
      },
    });

// Updated multer config with better error handling
export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', file.fieldname, file.mimetype);
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/jpg',
    ];

    if (!file.mimetype) {
      cb(new Error('No mimetype detected for uploaded file'));
      return;
    }

    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF and WEBP image files are allowed.`,
        ),
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
