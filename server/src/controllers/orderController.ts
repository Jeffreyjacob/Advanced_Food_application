import { NextFunction, Request, Response } from 'express';
import { OrderServices } from '../services/orderServies';
import { AsycnHandler } from '../utils/asyncHandler';
import {
  createCheckoutSessionValidators,
  getDriverRequestValidators,
  getOrdersValidators,
  getRestaurantRequestValidators,
  updateDriverRequestValidators,
  updateOrderValidators,
  updateRestaurantRequestValidator,
} from '../validators/order.validator';
import { updateRestaurantValidators } from '../validators/restaurant.validator';
import mongoose from 'mongoose';
import { parseQueryParams } from '../utils/helper';
import { OrderStatusEnum, RequestStatusEnum } from '../interface/enums/enums';

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

  static updateRestaurantRequestController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const requestId = req.params.id;
      const validatedBody = await updateRestaurantRequestValidator(req.body);

      const result = await OrderController.orderService.updateRestaurantRequest(
        {
          userId: req.user._id,
          data: validatedBody,
          requestId: new mongoose.Types.ObjectId(requestId),
        }
      );

      return res.status(200).json({
        message: result.message,
      });
    }
  );

  static updateOrderController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const orderId = req.params.id;

      const validatedBody = await updateOrderValidators(req.body);

      const result = await OrderController.orderService.updateOrder({
        userId: req.user._id,
        data: validatedBody,
        orderId: new mongoose.Types.ObjectId(orderId),
      });

      return res.status(200).json({
        message: result.message,
      });
    }
  );

  static updateDriverRequestController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const requestId = req.params.id;
      const validatedBody = await updateDriverRequestValidators(req.body);

      const result = await OrderController.orderService.updateDriverRequest({
        userId: req.user._id,
        data: validatedBody,
        requestId: new mongoose.Types.ObjectId(requestId),
      });

      return res.status(200).json({
        success: true,
        message: result?.message,
      });
    }
  );

  static getRestaurantRequest = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getNumber, getString } = parseQueryParams();

      const statusStr =
        req.query.status !== undefined && getString(req.query.status);
      const page = req.query.page !== undefined && getNumber(req.query.page);
      const limit = req.query.limi !== undefined && getNumber(req.query.limit);

      const status = statusStr ? (statusStr as RequestStatusEnum) : undefined;

      const body = {
        ...(status && { status }),
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody = await getRestaurantRequestValidators(body);

      const result = await OrderController.orderService.getRestaurantRequests({
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getDriverRequest = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getString, getNumber } = parseQueryParams();

      const statusStr =
        req.query.status !== undefined && getString(req.query.status);
      const limit = req.query.limit !== undefined && getNumber(req.query.limit);
      const page = req.query.page !== undefined && getNumber(req.query.page);

      const status = statusStr ? (statusStr as RequestStatusEnum) : undefined;

      const body = {
        ...(status && { status }),
        ...(page && { page }),
        ...(limit && { limit }),
      };

      const validatedBody = await getDriverRequestValidators(body);

      const result = await OrderController.orderService.getDriverRequest({
        userId: req.user._id,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getOrders = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { getString, getNumber } = parseQueryParams();

      const statusStr =
        req.query.status !== undefined && getString(req.query.status);

      const status = statusStr ? (statusStr as OrderStatusEnum) : undefined;
      const limit = getNumber(req.query.limit);
      const page = getNumber(req.query.page);

      const body = {
        ...(status && { status }),
        ...(limit && { limit }),
        ...(page && { page }),
      };

      const validatedBody = await getOrdersValidators(body);

      const result = await OrderController.orderService.getOrders({
        userId: req.user._id,
        role: req.user.role,
        data: validatedBody,
      });

      return res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getOrderById = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const orderId = req.params.id;

      const result = await OrderController.orderService.getOrderById({
        orderId: new mongoose.Types.ObjectId(orderId),
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );
}
