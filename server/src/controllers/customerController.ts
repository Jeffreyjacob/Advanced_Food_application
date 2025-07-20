import { NextFunction, Request, Response } from 'express';
import { CustomerService } from '../services/customerServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  addAddressValidators,
  updateAddressValidators,
  updateCustomerInfoValidators,
} from '../validators/customer.validator';
import mongoose from 'mongoose';
import { uploadImage } from '../utils/uploadImages';

export class CustomerController {
  private static customerService = new CustomerService();

  static GetCustomerInfo = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const customer = await CustomerController.customerService.GetCustomerInfo(
        {
          userId: req.user._id,
        }
      );

      return res.status(200).json({
        success: true,
        data: customer,
      });
    }
  );

  static UpdateCustomerInfo = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let avatar: string | undefined = undefined;
      if (req.file) {
        const imageUrl = await uploadImage(req.file as Express.Multer.File);
        avatar = imageUrl;
      }

      const parsedBody = {
        ...(req.body?.firstName && { firstName: req.body.firstName }),
        ...(req.body?.lastName && { lastName: req.body.lastName }),
        ...(req.body?.phone && { phone: req.body.phone }),
        ...(avatar && { avatar }),
        ...(req.body?.location && { location: req.body.location }),
        ...(req.body?.country && { country: req.body.country }),
        ...(req.body?.locationCoord && {
          locationCoord: req.body.locationCoord,
        }),
      };

      const validatedBody = await updateCustomerInfoValidators(parsedBody);

      const result =
        await CustomerController.customerService.updateCustomerInfo({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        mesage: result.message,
        data: result.data,
      });
    }
  );

  static AddCustomerAddress = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await addAddressValidators(req.body);

      const result = await CustomerController.customerService.addAddress({
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    }
  );

  static UpdateCustomerAddress = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const addressId = req.params.id;
      const validatedBody = await updateAddressValidators(req.body);

      const result = await CustomerController.customerService.updateAddress({
        addressId: new mongoose.Types.ObjectId(addressId),
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    }
  );
}
