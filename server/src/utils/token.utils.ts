import { Response } from 'express';
import { IBaseUser } from '../interface/models/models';
import jwt from 'jsonwebtoken';
import { RoleEnums } from '../interface/enums/enums';
import { getConfig } from '../config/config';

interface TokenPayload {
  id: string;
  userType: RoleEnums;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
const config = getConfig();

export const GenerateToken = (user: IBaseUser): TokenResponse => {
  const accessToken = jwt.sign(
    { id: user._id, userType: user.role },
    config.tokens.accessToken.tokenKey,
    {
      expiresIn: '15m',
    }
  );

  const refreshToken = jwt.sign(
    { id: user._id, userType: user.role },
    config.tokens.refreshToken.tokenKey,
    {
      expiresIn: '7d',
    }
  );

  return { accessToken, refreshToken };
};

export const VerifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(
    token,
    config.tokens.accessToken.tokenKey
  ) as TokenPayload;

  return decoded;
};

export const VerifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(
    token,
    config.tokens.refreshToken.tokenKey
  ) as TokenPayload;

  return decoded;
};

export const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  res.cookie('accessToken', accessToken, {
    httpOnly: config.env === 'production' ? true : false,
    sameSite: 'strict',
    secure: config.env === 'production' ? true : false,
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: config.env === 'production' ? true : false,
    sameSite: 'strict',
    secure: config.env === 'production' ? true : false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const ClearTokenCookies = (res: Response): void => {
  res.clearCookie('accessToken', {
    httpOnly: config.env === 'production' ? true : false,
    sameSite: 'strict',
    secure: config.env === 'production' ? true : false,
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  res.clearCookie('refreshToken', {
    httpOnly: config.env === 'production' ? true : false,
    sameSite: 'strict',
    secure: config.env === 'production' ? true : false,
    maxAge: 7 * 24 * 60 * 1000,
    path: '/',
  });
};
