import { NextFunction, Request, Response } from 'express';
import { RestaurantServies } from '../services/resturantServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  addRestaurantDocumentValidators,
  updateRestaurantDocumentValidators,
  updateRestaurantValidators,
} from '../validators/restaurant.validator';
import { uploadDocumentToCloudinary, uploadImage } from '../utils/uploadImages';
import { RestaurantDocumentTypeEnum } from '../interface/enums/enums';
import {
  changeMenuCategoryStatusValidators,
  createMenuCategoryValidators,
  updateDisplayOrderMenuCategoryValidators,
  updateMenuCategoryValidators,
} from '../validators/menuCategory.validators';
import mongoose from 'mongoose';

export class RestaurantController {
  private static restaurantService = new RestaurantServies();

  static UpdateRestaurantInfoController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let logo: string | undefined = undefined;
      if (req.file) {
        const imageUrl = await uploadImage(req.file as Express.Multer.File);
        logo = imageUrl;
      }

      const parsedBody = {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.address && { address: req.body.address }),
        ...(req.body.cuisineType && { cuisineType: req.body.cuisineType }),
        ...(req.body.description && { description: req.body.description }),
        ...(req.body.locationCoord && {
          locationCoord: req.body.locationCoord,
        }),
        ...(logo && { logo }),
      };

      const validatedBody = await updateRestaurantValidators(parsedBody);

      const result =
        await RestaurantController.restaurantService.updateRestaurantInfo({
          restaurantOwnerId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    }
  );

  static addRestaurantDocumentController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let url: string = '';
      if (req.file) {
        const imageUrl = await uploadDocumentToCloudinary(
          req.file as Express.Multer.File
        );
        url = imageUrl;
      }

      console.log(url);

      const parsedBody = {
        documentType: req.body.documentType as RestaurantDocumentTypeEnum,
        url: url,
      };

      const validatedBody = await addRestaurantDocumentValidators(parsedBody);

      const result =
        await RestaurantController.restaurantService.createRestaurantDocument({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        data: result.message,
      });
    }
  );

  static updateRestaurantDocumentController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let imageUrl: string = '';

      if (req.file) {
        const url = await uploadDocumentToCloudinary(
          req.file as Express.Multer.File
        );
        imageUrl = url;
      }

      const parsedBody = {
        documentType: req.body.documentType as RestaurantDocumentTypeEnum,
        url: imageUrl,
      };

      const validatedBody =
        await updateRestaurantDocumentValidators(parsedBody);

      const result =
        await RestaurantController.restaurantService.updateRestaurantDocument({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static getRestaurantDataController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result =
        await RestaurantController.restaurantService.getRestaurantDetail({
          userId: req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static createMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await createMenuCategoryValidators(req.body);

      const result =
        await RestaurantController.restaurantService.createMenuCategory({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static updateMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await updateMenuCategoryValidators(req.body);
      const categoryId = req.params.id;

      const result =
        await RestaurantController.restaurantService.updateMenuCategory({
          userId: req.user._id,
          categoryId: new mongoose.Types.ObjectId(categoryId),
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static updateDisplayOrderMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await updateDisplayOrderMenuCategoryValidators(
        req.body
      );

      const result =
        await RestaurantController.restaurantService.updateMenuCategoryDisplayOrder(
          {
            userId: req.user._id,
            data: validatedBody,
          }
        );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static toggleMenuCategoryStatus = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await changeMenuCategoryStatusValidators(req.body);

      const categoryId = req.params.id;
      const result =
        await RestaurantController.restaurantService.toggleMenUCategoryStatus({
          userId: req.user._id,
          categoryId: new mongoose.Types.ObjectId(categoryId),
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static deleteMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const categoryId = req.params.id;

      const result =
        await RestaurantController.restaurantService.deleteMenuCategory({
          userId: req.user._id,
          categoryId: new mongoose.Types.ObjectId(categoryId),
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static getAllMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result =
        await RestaurantController.restaurantService.getAllResturantMenuCategory(
          {
            userId: req.user._id,
          }
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static getActiveMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result =
        await RestaurantController.restaurantService.getActiveResturantMenuCategory(
          {
            userId: req.user._id,
          }
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );
}
