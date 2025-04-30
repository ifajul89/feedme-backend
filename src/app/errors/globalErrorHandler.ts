/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { TError } from '../interface/error';
import handleZodError from './handleZodError';
import handleValidationError from './handleValidationError';
import handleCastError from './handleCastError';
import handleDuplicateError from './handleDuplicateError';
import AppError from './appError';
import config from '../config';

const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
): void | Promise<void> => {
  // Log detailed error information for debugging
  console.error('Global error handler caught:', {
    name: err?.name,
    message: err?.message,
    code: err?.code,
    stack: err?.stack,
    body: req.body,
    path: req.path,
    method: req.method,
    headers: req.headers,
  });

  // default values
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorSources: TError = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
  }

  // Check for form-data parsing errors specifically
  if (
    err?.message?.includes('form-data') ||
    req.headers['content-type']?.includes('multipart/form-data')
  ) {
    console.log('Form-data error detected:', err);
    message = 'Error processing form data';
    errorSources = [
      {
        path: 'form-data',
        message:
          'There was an error processing your file upload. Please try again.',
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    // Include original error details in development and production (for debugging Vercel issue)
    originalError: {
      name: err?.name,
      code: err?.code,
      message: err?.message,
    },
    stack: config.NODE_ENV === 'development' ? err?.stack : null,
  });
};

export default globalErrorHandler;
