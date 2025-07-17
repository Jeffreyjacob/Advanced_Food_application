import { NextFunction, Request, Response } from 'express';
import { AuthenticationServices } from '../services/authServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  loginCustomerValidators,
  registerCustomerValidators,
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
}
