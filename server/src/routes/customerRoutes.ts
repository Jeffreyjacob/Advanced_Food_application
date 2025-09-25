import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { MulterUploadImage } from '../middleware/multer';
import { CustomerController } from '../controllers/customerController';
import {
  getAllRestaurants,
  getRestaurantMenuItemByCategoryId,
  getRestaurantMenuitems,
  getRestMenuCategories,
  handleQueryValidationErrors,
} from '../middleware/reqQueryValidators';
import CacheMiddleware, { cacheService } from '../utils/cache-service';

const customerRoutes = Router();
const cacheMiddleware = new CacheMiddleware(new cacheService());

customerRoutes
  .route('/')
  .get(
    Protect,
    RestricTo(RoleEnums.Customer),
    CustomerController.GetCustomerInfo
  );
customerRoutes
  .route('/update')
  .put(
    Protect,
    RestricTo(RoleEnums.Customer),
    MulterUploadImage.single('avatar'),
    CustomerController.UpdateCustomerInfo
  );

customerRoutes
  .route('/add/address')
  .post(
    Protect,
    RestricTo(RoleEnums.Customer),
    CustomerController.AddCustomerAddress
  );

customerRoutes
  .route('/restaurant')
  .get(
    getAllRestaurants,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Customer),
    cacheMiddleware.response(300),
    CustomerController.GetRestaurantsController
  );

customerRoutes
  .route('/restaurant/:id')
  .get(
    Protect,
    RestricTo(RoleEnums.Customer),
    cacheMiddleware.response(600),
    CustomerController.getRestaurantId
  );

customerRoutes
  .route('/restaurant/:id/menu/item')
  .get(
    getRestaurantMenuitems,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Customer),
    cacheMiddleware.response(600),
    CustomerController.getRestaurantAllMenuItems
  );

customerRoutes
  .route('/restaurant/:id/menu/category')
  .get(
    getRestMenuCategories,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Customer),
    cacheMiddleware.response(600),
    CustomerController.getRestaurantMenuCategories
  );

customerRoutes
  .route('/restaurant/:restaurantId/menu/category/:categoryId/item')
  .get(
    getRestaurantMenuItemByCategoryId,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Customer),
    cacheMiddleware.response(600),
    CustomerController.getRestaurantMenuItemByCategoryId
  );

customerRoutes
  .route('/update/address/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Customer),
    CustomerController.UpdateCustomerAddress
  );

export default customerRoutes;
