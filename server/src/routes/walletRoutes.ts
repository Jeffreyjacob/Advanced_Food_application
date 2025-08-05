import { Router } from 'express';
import { Protect, RestricTo } from '../middleware/authMiddleware';
import { RoleEnums } from '../interface/enums/enums';
import { WalletController } from '../controllers/walletController';

const walletRoutes = Router();

walletRoutes
  .route('/create')
  .post(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner, RoleEnums.Driver),
    WalletController.CreateStripeConnectAccount
  );

walletRoutes
  .route('/onBoardingLink')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner, RoleEnums.Driver),
    WalletController.onBoardingLinkController
  );

walletRoutes
  .route('/getWallet')
  .get(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner, RoleEnums.Driver),
    WalletController.GenerateWalletLink
  );

walletRoutes
  .route('/delete')
  .delete(
    Protect,
    RestricTo(RoleEnums.Restaurant_Owner, RoleEnums.Driver),
    WalletController.DeleteWalletController
  );

export default walletRoutes;
