import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError';
import {
  setTokenCookies,
  VerifyAccessToken,
  VerifyRefreshToken,
} from '../utils/token.utils';
import { BaseUser } from '../models/baseUser';
import { IBaseUser } from '../interface/models/models';
import { Tokens } from '../models/token';
import mongoose from 'mongoose';
import { RoleEnums } from '../interface/enums/enums';

declare global {
  namespace Express {
    interface Request {
      user: IBaseUser;
    }
  }
}

export const Protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new AppError('invalid or expired token', 401);
    }

    const decoded = VerifyAccessToken(accessToken);

    const user = await BaseUser.findById(decoded.id);

    if (!user) {
      throw new AppError(
        'the user this token belongs too , no longer exist ',
        401
      );
    }

    req.user = user;
    next();
  } catch (error: any) {
    next(error);
  }
};

export const SaveRefreshToken = async ({
  userId,
  refreshToken,
}: {
  userId: IBaseUser['_id'];
  refreshToken: string;
}): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await Tokens.create({
    user: userId,
    token: refreshToken,
    isExpiresAt: expiresAt,
  });
};

export const RefreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh = req.cookies.refreshToken;

    if (!refresh) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const decoded = VerifyRefreshToken(refresh);

    const user = await BaseUser.findById(decoded.id);

    if (!user) {
      throw new AppError(
        'You are not logged refresh in. Please log in to get access.',
        401
      );
    }

    const storedToken = await Tokens.findOne({
      user: new mongoose.Types.ObjectId(decoded.id),
      token: refresh,
      isRevoked: false,
      isExpiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const token = user.generateAuthTokens();

    const { accessToken, refreshToken } = token;

    await SaveRefreshToken({
      userId: user._id,
      refreshToken,
    });

    storedToken.isRevoked = true;
    await storedToken.save();

    setTokenCookies(res, accessToken, refreshToken);

    req.user = user;
    next();
  } catch (error: any) {
    next(error);
  }
};

export const RestricTo = (...role: RoleEnums[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated!', 401));
    }

    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You do not have permision to perform this action ', 403)
      );
    }

    next();
  };
};
