import express, { Request, Response } from 'express';
import cors from 'cors';
import router from './app/routes';
import notFound from './app/middleware/notFound';
import globalErrorHandler from './app/errors/globalErrorHandler';
import cookieParser from 'cookie-parser';
const app = express();

// Log middleware initialization
console.log('Initializing middleware...');

// Using parsers - order matters!
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Don't use raw middleware for multipart/form-data as it conflicts with multer
// app.use(express.raw({ type: 'multipart/form-data', limit: '10mb' }));

app.use(cookieParser());

// Configure CORS
app.use(
  cors({
    origin: ['https://velocity-car-shop.vercel.app', 'http://localhost:5173'], // Your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.url}, Content-Type: ${req.headers['content-type']}`,
  );
  next();
});

// Using router
app.use('/api', router);

// Basic health check
app.get('/', (req: Request, res: Response) => {
  console.log('Server is running and receiving requests');
  res.send('Server is running 💨🏃‍♀️');
});

// Global error handler
app.use(globalErrorHandler);

// Not found
app.use(notFound);

export default app;
