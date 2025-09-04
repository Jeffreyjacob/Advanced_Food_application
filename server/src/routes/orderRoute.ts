import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { OrderController } from '../controllers/orderController';

const orderRoute = Router();

orderRoute
  .route('/createCheckoutSession')
  .post(
    Protect,
    RestricTo(RoleEnums.Customer),
    OrderController.createChechkoutSession
  );

export default orderRoute;
