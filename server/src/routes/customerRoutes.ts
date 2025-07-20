import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { MulterUploadImage } from '../middleware/multer';
import { CustomerController } from '../controllers/customerController';

const customerRoutes = Router();

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
  .route('/update/address/:id')
  .put(
    Protect,
    RestricTo(RoleEnums.Customer),
    CustomerController.UpdateCustomerAddress
  );

export default customerRoutes;
