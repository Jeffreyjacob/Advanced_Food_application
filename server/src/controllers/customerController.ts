import { NextFunction, Request, Response } from 'express';
import { CustomerService } from '../services/customerServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  addAddressValidators,
  getRestaurantAllMenuItemsValidators,
  getRestaurantMenuCategoriesValidator,
  getRestaurantMenuItemByCategoryIdValidators,
  getRestaurantValidators,
  updateAddressValidators,
  updateCustomerInfoValidators,
} from '../validators/customer.validator';
import mongoose from 'mongoose';
import { uploadImage } from '../utils/uploadImages';
import { parseQueryParams } from '../utils/helper';
import { uploadFileToS3 } from '../utils/uploadS3';

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
        const imageUrl = await uploadFileToS3(
          req.file as Express.Multer.File,
          'avatars'
        );
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

  static GetRestaurantsController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getString, getBoolean, getNumber } = parseQueryParams();

      const name = getString(req.query.name);
      const cusine = getString(req.query.cusine);
      const nearBy = getBoolean(req.query.nearBy);
      const limit = getNumber(req.query.limit);
      const page = getNumber(req.query.page);

      const body = {
        ...(name && { name }),
        ...(nearBy && { nearBy }),
        ...(cusine && { cusine }),
        ...(limit && { limit }),
        ...(page && { page }),
      };

      const validatedBody = await getRestaurantValidators(body);
      const result = await CustomerController.customerService.getRestaurants({
        userId: req.user.id,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getRestaurantId = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const restaurantId = req.params.id;
      const result = await CustomerController.customerService.getRestaurantById(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
        }
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static getRestaurantMenuCategories = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const restaurantId = req.params.id;

      const { getString, getNumber } = parseQueryParams();

      const name = getString(req.query.name);
      const page = getNumber(req.query.page);
      const limit = getNumber(req.query.limit);

      const body = {
        ...(name && { name }),
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody = await getRestaurantMenuCategoriesValidator(body);

      const result =
        await CustomerController.customerService.getRestaurantMenuCategories({
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getRestaurantMenuItemByCategoryId = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const restaurantId = req.params.restaurantId;
      const categoryId = req.params.categoryId;

      const { getNumber } = parseQueryParams();

      const page = getNumber(req.query.page);
      const limit = getNumber(req.query.limit);

      const body = {
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody =
        await getRestaurantMenuItemByCategoryIdValidators(body);

      const result =
        await CustomerController.customerService.getRestaurantMenuItemByCategoryId(
          {
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            categoryId: new mongoose.Types.ObjectId(categoryId),
            data: validatedBody,
          }
        );

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getRestaurantAllMenuItems = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const restaurantId = req.params.id;

      const { getNumber, getString } = parseQueryParams();

      const name = getString(req.query.name);
      const page = getNumber(req.query.page);
      const limit = getNumber(req.query.limit);

      const body = {
        ...(name && { name }),
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody = await getRestaurantAllMenuItemsValidators(body);

      const result =
        await CustomerController.customerService.getRestaurantAllMenuItems({
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );
}
