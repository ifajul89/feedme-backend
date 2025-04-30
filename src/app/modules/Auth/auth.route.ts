import { Router } from 'express';
import { AuthController } from './auth.controller';
import validateRequest from '../../middleware/validateRequest';
import { UserValidation } from '../user/user.validation';
import { authValidation } from './auth.validation';

const authRoute = Router();
authRoute.post(
  '/register',
  validateRequest(UserValidation.userValidationSchema),
  AuthController.register,
);
authRoute.post(
  '/login',
  validateRequest(authValidation.loginValidation),
  AuthController.login,
);
authRoute.post(
  '/refresh-token',
  validateRequest(authValidation.refreshTokenValidationSchema),
  AuthController.refreshToken,
);
authRoute.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPasswordValidation),
  AuthController.forgotPassword,
);
authRoute.post(
  '/reset-password',
  validateRequest(authValidation.resetPasswordValidation),
  AuthController.resetPassword,
);

export default authRoute;
