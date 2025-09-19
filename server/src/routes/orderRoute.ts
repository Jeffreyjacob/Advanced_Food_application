import { Request, Response, Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { OrderController } from '../controllers/orderController';
import {
  getDriverRequestValidator,
  getRestaurantRequestValidator,
  handleQueryValidationErrors,
} from '../middleware/reqQueryValidators';

const orderRoute = Router();

orderRoute
  .route('/createCheckoutSession')
  .post(
    Protect,
    RestricTo(RoleEnums.Customer),
    OrderController.createChechkoutSession
  );

orderRoute
  .route('/request/restaurant')
  .get(
    getRestaurantRequestValidator,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    OrderController.getRestaurantRequest
  );

orderRoute
  .route('/request/driver')
  .get(
    getDriverRequestValidator,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Driver),
    OrderController.getDriverRequest
  );

orderRoute
  .route('/restaurant/request/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    OrderController.updateRestaurantRequestController
  );

orderRoute
  .route('/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner, RoleEnums.Driver),
    OrderController.updateOrderController
  );

orderRoute
  .route('/driver/request/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Driver),
    OrderController.updateDriverRequestController
  );

orderRoute.route('/successUrl').get((req: Request, res: Response) => {
  return res.status(200).json({
    message: 'checkout successful!',
  });
});

export default orderRoute;
