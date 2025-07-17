import { Router } from 'express';
import { AuthenticationController } from '../controllers/authController';

const authRoutes = Router();

authRoutes
  .route('/register/customer')
  .post(AuthenticationController.RegisterCustomerController);

authRoutes
  .route('/verifyOtp')
  .post(AuthenticationController.VerifyOtpController);
authRoutes
  .route('/resendOtp')
  .post(AuthenticationController.ResendOtpController);

authRoutes
  .route('/login/customer')
  .post(AuthenticationController.LoginCustomerController);

export default authRoutes;
