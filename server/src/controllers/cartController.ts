import { NextFunction, Request, Response } from 'express';
import { CartService } from '../services/cartServices';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  addToCartValidators,
  updateCartItemValidators,
} from '../validators/cart.Validator';
import mongoose from 'mongoose';

export class CartController {
  private static cartService = new CartService();

  static AddToCartController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await addToCartValidators(req.body);

      const result = await CartController.cartService.addToCart({
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(201).json({
        success: true,
        message: result?.message,
        data: result?.data,
      });
    }
  );
  static UpdateCartItemController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const cartItemid = req.params.id;
      const validatedBody = await updateCartItemValidators(req.body);

      const result = await CartController.cartService.updateCartItem({
        userId: req.user._id,
        cartItemId: new mongoose.Types.ObjectId(cartItemid),
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        message: result?.message,
      });
    }
  );

  static getCartsController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await CartController.cartService.getCart({
        userId: req.user._id,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );
}
