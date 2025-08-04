import { NextFunction, Request, Response } from 'express';
import { WalletServices } from '../services/walletServices';
import { AsycnHandler } from '../utils/asyncHandler';

export class WalletController {
  private static walletService = new WalletServices();

  static CreateStripeConnectAccount = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result =
        await WalletController.walletService.createStripeConnectAccount({
          data: {
            userId: req.user._id,
            role: req.user.role,
          },
        });

      return res.status(201).json({
        success: true,
        message: result?.message,
        data: result?.data,
      });
    }
  );

  static onBoardingLinkController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await WalletController.walletService.OnBoardingLink({
        data: {
          userId: req.user._id,
          role: req.user.role,
        },
      });

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    }
  );

  static GenerateWalletLink = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await WalletController.walletService.generateStripeWallet({
        req,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  static DeleteWalletController = AsycnHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await WalletController.walletService.deleteWallet({
        userId: req.user._id,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    }
  );
}
