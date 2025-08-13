import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import multer from 'multer';
import { MulterUploadImage } from '../middleware/multer';
import { RestaurantController } from '../controllers/restaurantController';

const restaurantRoutes = Router();

restaurantRoutes
  .route('/update')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    MulterUploadImage.single('logo'),
    RestaurantController.updateRestaurantDocumentController
  );

restaurantRoutes
  .route('/addDocuments')
  .post(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    MulterUploadImage.single('url'),
    RestaurantController.addRestaurantDocumentController
  );

restaurantRoutes
  .route('/updateDocuments')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    MulterUploadImage.single('url'),
    RestaurantController.updateRestaurantDocumentController
  );

restaurantRoutes
  .route('/')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getRestaurantDataController
  );

restaurantRoutes
  .route('/menu/category/all')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getAllMenuCategory
  );

restaurantRoutes
  .route('/menu/category/active')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getActiveMenuCategory
  );

restaurantRoutes
  .route('/menu/category/create')
  .post(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.createMenuCategory
  );
restaurantRoutes
  .route('/menu/category/order/update')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.updateDisplayOrderMenuCategory
  );

restaurantRoutes
  .route('/menu/category/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.updateMenuCategory
  );

restaurantRoutes
  .route('/menu/category/status/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.toggleMenuCategoryStatus
  );

restaurantRoutes
  .route('/menu/category/delete/:id')
  .delete(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.deleteMenuCategory
  );

export default restaurantRoutes;
