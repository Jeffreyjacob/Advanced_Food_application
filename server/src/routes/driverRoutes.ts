import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { DriverController } from '../controllers/driverController';
import { MulterUploadImage } from '../middleware/multer';

const driverRouter = Router();

driverRouter
  .route('/createIdentityVerification')
  .post(
    Protect,
    RestricTo(RoleEnums.Driver),
    DriverController.createVerificationSession
  );

driverRouter
  .route('/restartIdentityVerification')
  .post(
    Protect,
    RestricTo(RoleEnums.Driver),
    DriverController.restartVerification
  );

driverRouter
  .route('/update')
  .put(Protect, RestricTo(RoleEnums.Driver), DriverController.updateDriverInfo);

driverRouter
  .route('/update/document')
  .put(
    Protect,
    RestricTo(RoleEnums.Driver),
    MulterUploadImage.single('url'),
    DriverController.updateVehicleRegisteration
  );

driverRouter
  .route('/')
  .get(Protect, RestricTo(RoleEnums.Driver), DriverController.getDriverInfo);

export default driverRouter;
