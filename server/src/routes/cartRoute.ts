import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { CartController } from '../controllers/cartController';

const cartRouter = Router();

cartRouter
  .route('/')
  .get(
    Protect,
    RestricTo(RoleEnums.Customer),
    CartController.getCartsController
  );

cartRouter
  .route('/add')
  .post(
    Protect,
    RestricTo(RoleEnums.Customer),
    CartController.AddToCartController
  );

cartRouter
  .route('/cartItem/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Customer),
    CartController.UpdateCartItemController
  );

export default cartRouter;
