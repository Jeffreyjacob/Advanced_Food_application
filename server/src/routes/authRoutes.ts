import { Router } from 'express';
import { AuthenticationController } from '../controllers/authController';
import { Protect } from '../middleware/authMiddleware';

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

authRoutes
  .route('/register/restaurant')
  .post(AuthenticationController.RegisterRestaurantOwnerController);

authRoutes
  .route('/login/restaurant')
  .post(AuthenticationController.LoginRestaurantOwnerController);

authRoutes
  .route('/register/driver')
  .post(AuthenticationController.RegisterDriverController);

authRoutes
  .route('/login/driver')
  .post(AuthenticationController.LoginDriverController);

authRoutes
  .route('/forgetPassword')
  .post(AuthenticationController.ForgetPasswordController);

authRoutes
  .route('/resetPassword')
  .post(AuthenticationController.ResetPasswordController);

authRoutes
  .route('/refreshAccessToken')
  .post(Protect, AuthenticationController.RefreshAccessTokenController);

authRoutes
  .route('/logout')
  .post(Protect, AuthenticationController.LogOutController);

authRoutes.route('/').get(Protect, AuthenticationController.AuthUserController);

export default authRoutes;
