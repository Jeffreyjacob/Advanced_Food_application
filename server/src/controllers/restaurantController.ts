import { NextFunction, Request, Response } from 'express';
import { RestaurantServies } from '../services/resturantServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  addRestaurantDocumentValidators,
  updateRestaurantValidators,
} from '../validators/restaurant.validator';
import { uploadImage } from '../utils/uploadImages';
import { RestaurantDocumentTypeEnum } from '../interface/enums/enums';

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

  static addRestaurantController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let url: string = '';
      if (req.file) {
        const imageUrl = await uploadImage(req.file as Express.Multer.File);
        url = imageUrl;
      }

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
}
