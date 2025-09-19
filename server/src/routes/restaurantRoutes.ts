import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import multer from 'multer';
import { MulterUploadImage } from '../middleware/multer';
import { RestaurantController } from '../controllers/restaurantController';
import {
  ActiveMenuItem,
  AllMenuItem,
  handleQueryValidationErrors,
  SearchMenuItemValidator,
} from '../middleware/reqQueryValidators';

const restaurantRoutes = Router();

restaurantRoutes
  .route('/update')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    MulterUploadImage.single('logo'),
    RestaurantController.UpdateRestaurantInfoController
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
  .route('/menu/item/create')
  .post(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    MulterUploadImage.single('image'),
    RestaurantController.createMenuItem
  );
restaurantRoutes
  .route('/menu/category/order/update')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.updateDisplayOrderMenuCategory
  );

restaurantRoutes
  .route('/menu/item/order')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.updateMenuItemDisplayOrder
  );

restaurantRoutes
  .route('/menu/item/active')
  .get(
    ActiveMenuItem,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getActiveMenuItems
  );

restaurantRoutes
  .route('/menu/item')
  .get(
    AllMenuItem,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getAllMenuItem
  );

restaurantRoutes
  .route('/menu/item/search')
  .get(
    SearchMenuItemValidator,
    handleQueryValidationErrors,
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.SearchMenuitems
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

restaurantRoutes
  .route('/menu/item/update/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    MulterUploadImage.single('image'),
    RestaurantController.updateMenuItem
  );

restaurantRoutes
  .route('/menu/item/status/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.toggleMenuItemStatus
  );

restaurantRoutes
  .route('/menu/item/delete/:id')
  .delete(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.deleteMenuItem
  );

restaurantRoutes
  .route('/menu/item/category/:id')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getMenuItemByCategoryId
  );

restaurantRoutes
  .route('/menu/item/:id')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner),
    RestaurantController.getMenuItemById
  );

export default restaurantRoutes;
