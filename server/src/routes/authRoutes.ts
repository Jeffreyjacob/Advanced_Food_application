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
  .post(AuthenticationController.RsendOtpController);

export default authRoutes;
