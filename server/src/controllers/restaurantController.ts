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
  createMenuItemValidators,
  getActiveMenuItemsValidators,
  getAllMenuItemsValidators,
  SearchMenuItemsValidators,
  toggleMenuItemStatusValidators,
  updateDisplayOrderMenuCategoryValidators,
  updateMenuCategoryValidators,
  updateMenuItemDisplayOrderValidator,
  updateMenuItemValidators,
} from '../validators/menuCategory.validators';
import mongoose from 'mongoose';
import { BodyParsing, parseQueryParams } from '../utils/helper';

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
        ...(req.body.isOpen && { isOpen: req.body.isOpen }),
        ...(req.body.isAcceptingOrders && {
          isAcceptingOrders: req.body.isAcceptingOrders,
        }),
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
        await RestaurantController.restaurantService.getAllMenuCategory({
          userId: req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static getActiveMenuCategory = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result =
        await RestaurantController.restaurantService.getActiveMenuCategory({
          userId: req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static createMenuItem = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let imageUrl: string = '';
      if (req.file) {
        const image = await uploadImage(req.file as Express.Multer.File);
        imageUrl = image;
      }

      const parsedData = await BodyParsing(req.body);

      const body = {
        ...parsedData,
        image: imageUrl,
      };

      console.log(body);

      const validatedBody = await createMenuItemValidators(body);

      const result =
        await RestaurantController.restaurantService.createMenuItem({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        succes: true,
        message: result.message,
      });
    }
  );

  static updateMenuItem = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let imageUrl: string = '';

      const menuItemId = req.params.id;

      if (req.file) {
        const url = await uploadImage(req.file as Express.Multer.File);
        imageUrl = url;
      }

      const parsedBody = await BodyParsing(req.body);

      const body = {
        ...(imageUrl && { image: imageUrl }),
        ...parsedBody,
      };

      const validatedBody = await updateMenuItemValidators(body);

      const result =
        await RestaurantController.restaurantService.updateMenuItem({
          userId: req.user._id,
          data: validatedBody,
          menuItemId: new mongoose.Types.ObjectId(menuItemId),
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static updateMenuItemDisplayOrder = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await updateMenuItemDisplayOrderValidator(req.body);

      const result =
        await RestaurantController.restaurantService.updateMenuItemDisplayOrder(
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

  static toggleMenuItemStatus = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const menuItemId = req.params.id;
      const validatedBody = await toggleMenuItemStatusValidators(req.body);

      const result =
        await RestaurantController.restaurantService.toggleMenuItemStatus({
          userId: req.user._id,
          menuItemId: new mongoose.Types.ObjectId(menuItemId),
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static deleteMenuItem = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const menuItemId = req.params.id;

      const result =
        await RestaurantController.restaurantService.deleteMenuItem({
          userId: req.user._id,
          menuItemId: new mongoose.Types.ObjectId(menuItemId),
        });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );

  static getMenuItemByCategoryId = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const categoryId = req.params.id;

      const result =
        await RestaurantController.restaurantService.getMenuItemByCategoryId({
          categoryId: new mongoose.Types.ObjectId(categoryId),
          userId: req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static getMenuItemById = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const menuItemId = req.params.id;

      const result =
        await RestaurantController.restaurantService.getMenuItemById({
          menuItemId: new mongoose.Types.ObjectId(menuItemId),
          userId: req.user._id,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static getActiveMenuItems = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getNumber } = parseQueryParams();

      const page = getNumber(req.query.page);
      const limit = getNumber(req.query.limit);

      const body = {
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody = await getActiveMenuItemsValidators(body);

      const result =
        await RestaurantController.restaurantService.getActiveMenuItems({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getAllMenuItem = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getNumber } = parseQueryParams();

      const page = getNumber(req.query.page);
      const limit = getNumber(req.query.limit);

      const body = {
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedbody = await getAllMenuItemsValidators(body);

      const result =
        await RestaurantController.restaurantService.getAllMenuItems({
          userId: req.user._id,
          data: validatedbody,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static SearchMenuitems = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getNumber, getString, getBoolean } = parseQueryParams();

      const name = req.query.name !== undefined && getString(req.query.name);
      const minPrice = getNumber(req.query.minPrice);
      const maxPrice = getNumber(req.query.maxPrice);
      const isSpicy = getBoolean(req.query.isSpicy);
      const isVegan = getBoolean(req.query.isVegan);
      const isVegetarian = getBoolean(req.query.isVegetarian);
      const page = getNumber(req.query.page);
      const limit = getNumber(req.query.limit);

      const body = {
        ...(name && { name }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(isSpicy && { isSpicy }),
        ...(isVegan && { isVegan }),
        ...(isVegetarian && { isVegetarian }),
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody = await SearchMenuItemsValidators(body);

      const result =
        await RestaurantController.restaurantService.SearchMenuItems({
          userId: req.user._id,
          data: validatedBody,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );
}
