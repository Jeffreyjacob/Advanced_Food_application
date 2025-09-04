import { NextFunction, Request, Response } from 'express';
import { OrderServices } from '../services/orderServies';
import { AsycnHandler } from '../utils/asyncHandler';
import { createCheckoutSessionValidators } from '../validators/order.validator';

export class OrderController {
  private static orderService = new OrderServices();

  static createChechkoutSession = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validatedBody = await createCheckoutSessionValidators(req.body);

      const result = await OrderController.orderService.createCheckoutSession({
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(201).json({
        success: true,
        message: 'checkout session created',
        url: result.checkoutSession.url,
        order: result.order,
      });
    }
  );
}
