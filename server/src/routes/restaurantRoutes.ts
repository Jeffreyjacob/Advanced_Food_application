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

export default restaurantRoutes;
