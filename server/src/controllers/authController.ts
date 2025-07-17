import { NextFunction, Request, Response } from 'express';
import { AuthenticationServices } from '../services/authServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  loginCustomerValidators,
  loginDriverValidators,
  loginRestaurantOwnerValidators,
  registerCustomerValidators,
  registerDriverValidators,
  registerRestaurantOwnerValidators,
  resendOtpValidators,
  verifyOtpValidators,
} from '../validators/auth.Validator';

export class AuthenticationController {
  private static authService = new AuthenticationServices();

  static RegisterCustomerController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await registerCustomerValidators(req.body);

      const result =
        await AuthenticationController.authService.registerCustomer({
          data: validatedBody,
        });

      return res.status(201).json({
        success: true,
        data: result.message,
      });
    }
  );

  static VerifyOtpController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await verifyOtpValidators(req.body);

      const result = await AuthenticationController.authService.VerifyOTP({
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        data: result.message,
      });
    }
  );

  static ResendOtpController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await resendOtpValidators(req.body);

      const result = await AuthenticationController.authService.ResendOtp({
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        data: result.message,
      });
    }
  );

  static LoginCustomerController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await loginCustomerValidators(req.body);

      const result = await AuthenticationController.authService.LoginCustomer({
        res,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        data: result.message,
      });
    }
  );

  static RegisterRestaurantOwnerController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await registerRestaurantOwnerValidators(req.body);

      const result =
        await AuthenticationController.authService.registerRestaurantOwner({
          data: validatedBody,
        });

      return res.status(201).json({
        success: true,
        data: result.message,
      });
    }
  );

  static LoginRestaurantOwnerController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await loginRestaurantOwnerValidators(req.body);

      const result =
        await AuthenticationController.authService.loginRestaurantOwner({
          res,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        data: result.message,
      });
    }
  );

  static RegisterDriverController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await registerDriverValidators(req.body);

      const result = await AuthenticationController.authService.RegisterDriver({
        data: validatedBody,
      });

      return res.status(201).json({
        succes: true,
        data: result.message,
      });
    }
  );

  static LoginDriverController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await loginDriverValidators(req.body);

      const result = await AuthenticationController.authService.LoginDriver({
        res,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        data: result.message,
      });
    }
  );
}
