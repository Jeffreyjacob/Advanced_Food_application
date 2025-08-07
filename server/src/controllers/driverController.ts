import { NextFunction, Request, Response } from 'express';
import { DriverServices } from '../services/driverServies';
import { AsycnHandler } from '../utils/asyncHandler';

export class DriverController {
  private static driverServices = new DriverServices();

  static createVerificationSession = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result =
        await DriverController.driverServices.createVerificationSession(
          req.user.id
        );

      return res.status(201).json({
        success: true,
        url: result.url,
        sessionId: result.sessionId,
        client_secret: result.clientSecret,
      });
    }
  );

  static restartVerification = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await DriverController.driverServices.restartVerification(
        req.user.id
      );

      return res.status(200).json({
        success: true,
        url: result.url,
        sessionId: result.sessionId,
        client_secret: result.clientSecret,
      });
    }
  );
}
