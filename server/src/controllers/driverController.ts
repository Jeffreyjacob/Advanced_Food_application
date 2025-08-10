import { NextFunction, Request, Response } from 'express';
import { DriverServices } from '../services/driverServies';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  updateDriverInfoValidator,
  updateVehicleRegisterationValidators,
} from '../validators/driver.Validator';
import { uploadDocumentToCloudinary } from '../utils/uploadImages';

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

  static updateDriverInfo = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await updateDriverInfoValidator(req.body);

      const result = await DriverController.driverServices.UpdateDriverInfo({
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static updateVehicleRegisteration = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let imageUrl: string = '';
      if (req.file) {
        const document = await uploadDocumentToCloudinary(
          req.file as Express.Multer.File
        );
        imageUrl = document;
      }

      const reqBody = {
        url: imageUrl,
      };

      const validatedBody = await updateVehicleRegisterationValidators(reqBody);
      const result =
        await DriverController.driverServices.updateDriverVehicleRegisteration({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static getDriverInfo = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await DriverController.driverServices.getDriverInfo({
        userId: req.user._id,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );
}
