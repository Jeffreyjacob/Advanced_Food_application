import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { DriverController } from '../controllers/driverController';

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

export default driverRouter;
