import dayjs from 'dayjs';
import { RoleEnums } from '../interface/enums/enums';
import {
  IAuthenticationMutation,
  ICustomerMutation,
  IDriverMutation,
  IRestaurantMutation,
} from '../interface/interface/interface';
import { Customer } from '../models/customer';
import { emailQueue } from '../queue/email/queue';
import { AppError } from '../utils/appError';
import { EmailVerificationHTMl } from '../utils/EmailTemplate/emailVerification';
import { generateOtp } from '../utils/helper';
import config from '../config/config';
import { BaseUser } from '../models/baseUser';
import { SaveRefreshToken } from '../middleware/authMiddleware';
import { setTokenCookies } from '../utils/token.utils';
import { Response } from 'express';
import { RestaurantOwner } from '../models/restaurantOwner';
import { Restaurant } from '../models/restaurant';
import mongoose from 'mongoose';
import { Driver } from '../models/driver';

export class AuthenticationServices {
  async registerCustomer({
    data,
  }: {
    data: ICustomerMutation['registerCustomer'];
  }) {
    const checkIfEmailAlreadyExist = await Customer.findOne({
      email: data.email,
    });

    if (checkIfEmailAlreadyExist) {
      throw new AppError('Email already exist', 400);
    }

    const customer = await Customer.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      country: data.country,
      traceableLocation: {
        type: 'Point',
        coordinates: data.locationCord,
      },
      role: RoleEnums.Customer,
    });

    customer.emailOtp = generateOtp();
    customer.emailisVerified = false;

    await customer.save();

    const formattedExpiry = dayjs(customer.emailOtpExpiresAt).format(
      'hh:mm A, MMM DD YYYY'
    );

    const EmailUrl = `${config.frontendUrls.verifiyEmail}?email=${customer.email}`;

    const html = EmailVerificationHTMl({
      firstname: customer.firstName,
      companyName: 'JetFoods',
      expiryTime: formattedExpiry,
      otp: customer.emailOtp,
      url: EmailUrl,
    });

    try {
      const job = await emailQueue.add('emailverification', {
        to: customer.email,
        subject: 'Email verification',
        body: html,
        template: 'verifyEmail',
      });
    } catch (error) {
      console.error('Error adding job to queue:', error);
      throw new AppError('Failed to send verification email', 500);
    }
    return {
      message:
        'User created, Please verify your email to finish sign up proccess',
    };
  }

  async VerifyOTP({ data }: { data: IAuthenticationMutation['verifyOtp'] }) {
    const verifyuser = await BaseUser.findOne({
      emailOtp: data.otp,
      emailOtpExpiresAt: { $gt: new Date() },
      emailisVerified: false,
    });

    if (!verifyuser) {
      throw new AppError('Otp is invalid or expired', 400);
    }

    const updateUser = await BaseUser.findByIdAndUpdate(verifyuser._id, {
      $set: {
        emailisVerified: true,
      },
      $unset: {
        emailOtp: 1,
        emailOtpExpiresAt: 1,
      },
    });

    if (!updateUser) {
      throw new AppError('Unable to update user, try again', 400);
    }

    return {
      message: 'Your email has been verified',
    };
  }

  async ResendOtp({ data }: { data: IAuthenticationMutation['resendOtp'] }) {
    const user = await BaseUser.findOne({
      email: data.email,
    });

    if (!user) {
      throw new AppError('Unable to find User with email', 404);
    }

    user.emailOtp = generateOtp();
    user.emailisVerified = false;

    await user.save();

    const formattedExpiry = dayjs(user.emailOtpExpiresAt).format(
      'hh:mm A, MMM DD YYYY'
    );

    const EmailUrl = `${config.frontendUrls.verifiyEmail}?email=${user.email}`;

    const html = EmailVerificationHTMl({
      firstname: user.firstName,
      companyName: 'JetFoods',
      expiryTime: formattedExpiry,
      otp: user.emailOtp,
      url: EmailUrl,
    });

    await emailQueue.add('ResendOtp', {
      to: user.email,
      subject: 'Email verification',
      body: html,
      template: 'verifyEmail',
    });

    return {
      message: 'Otp has been sent',
    };
  }

  async LoginCustomer({
    res,
    data,
  }: {
    res: Response;
    data: ICustomerMutation['loginCustomer'];
  }) {
    const user = await Customer.findOne({
      email: data.email,
      isVerified: true,
      role: RoleEnums.Customer,
    });

    if (!user) {
      throw new AppError('Invalid credentials, try again', 400);
    }

    if (
      user.accountLockedUntil &&
      new Date(user.accountLockedUntil) > new Date()
    ) {
      const lockTimeRemaining = Math.ceil(
        Math.ceil(
          (new Date(user.accountLockedUntil).getTime() - new Date().getTime()) /
            (1000 * 60)
        )
      );

      throw new AppError(
        `Your account is locked, try again in ${lockTimeRemaining} minutes`,
        423
      );
    }

    if (user.emailisVerified !== undefined && user.emailisVerified === false) {
      throw new AppError(
        'You have to verified your email, before you can login',
        400
      );
    }

    const comparedPassword = await user.comparePassword(data.password);

    if (!comparedPassword) {
      const maxAttempt = 5;
      const currentAttempts = (user.loginAttempts || 0) + 1;

      if (currentAttempts >= maxAttempt) {
        const lockDuration = 30 * 60 * 1000;

        await Customer.findOneAndUpdate(
          {
            email: data.email,
          },
          {
            loginAttempts: currentAttempts,
            accountLockedUntil: new Date(Date.now() + lockDuration),
          }
        );

        throw new AppError(
          'Your account is locked due Too many attempts, try again in 30 minutes',
          423
        );
      } else {
        await Customer.findOneAndUpdate(
          {
            email: data.email,
          },
          {
            loginAttempts: currentAttempts,
          }
        );

        const attemptLefts = maxAttempt - currentAttempts;

        throw new AppError(
          `Invalid credentials, you have ${attemptLefts} attempts lefts`,
          423
        );
      }
    }

    const updateuser = await Customer.findOneAndUpdate(
      {
        email: data.email,
      },
      {
        $set: {
          isActive: true,
        },
        $unset: {
          loginAttempts: 1,
          accountLockedUntil: 1,
        },
      }
    );

    if (!updateuser) {
      throw new AppError('Unable to update user, try again later', 400);
    }

    const token = user.generateAuthTokens();

    const { accessToken, refreshToken } = token;

    await SaveRefreshToken({ userId: user._id, refreshToken });

    setTokenCookies(res, accessToken, refreshToken);

    return {
      message: 'Login successful!',
    };
  }

  async registerRestaurantOwner({
    data,
  }: {
    data: IRestaurantMutation['createRestaurant'];
  }) {
    const checkIfEmailAlreadyExist = await BaseUser.findOne({
      email: data.email,
    });

    if (checkIfEmailAlreadyExist) {
      throw new AppError('Email already exist', 400);
    }

    const createRestaurantOwner = await RestaurantOwner.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      country: data.country,
      role: RoleEnums.Restaurant_Owner,
    });

    if (!createRestaurantOwner) {
      throw new AppError('unable to create restaurant owner profile', 400);
    }

    const createRestaurant = await Restaurant.create({
      name: data.RestaurantName,
      owner: createRestaurantOwner._id,
      address: data.RestaurantAddress,
      traceableLocation: {
        type: 'Point',
        coordinates: data.locationCord,
      },
      description: data.description,
      cuisineType: data.cuisineType,
    });

    if (!createRestaurant) {
      throw new AppError('Unable to create restaurant profile', 400);
    }

    createRestaurantOwner.emailOtp = generateOtp();
    createRestaurantOwner.emailisVerified = false;
    createRestaurantOwner.ownedRestaurant = createRestaurant._id;

    await createRestaurantOwner.save();

    const formattedExpiry = dayjs(
      createRestaurantOwner.emailOtpExpiresAt
    ).format('hh:mm A, MMM DD YYYY');

    const EmailUrl = `${config.frontendUrls.verifiyEmail}?email=${createRestaurantOwner.email}`;

    const html = EmailVerificationHTMl({
      firstname: createRestaurantOwner.firstName,
      companyName: 'JetFoods',
      expiryTime: formattedExpiry,
      otp: createRestaurantOwner.emailOtp,
      url: EmailUrl,
    });

    await emailQueue.add('emailverification', {
      to: createRestaurantOwner.email,
      subject: 'Email verification',
      body: html,
      template: 'verifyEmail',
    });

    return {
      message:
        'User created, Please verify your email to finish sign up proccess',
    };
  }

  async loginRestaurantOwner({
    res,
    data,
  }: {
    res: Response;
    data: IRestaurantMutation['loginRestaurant'];
  }) {
    const user = await RestaurantOwner.findOne({
      email: data.email,
      isVerified: true,
      role: RoleEnums.Restaurant_Owner,
    });

    if (!user) {
      throw new AppError('Invalid credentials,Try again!', 400);
    }

    if (user.emailisVerified !== undefined && user.emailisVerified === false) {
      throw new AppError(
        'Please verify your email, before you are able to login',
        400
      );
    }

    if (
      user.accountLockedUntil &&
      new Date(user.accountLockedUntil) > new Date()
    ) {
      const lockTimeRemaining = Math.ceil(
        (new Date(user.accountLockedUntil).getTime() - new Date().getTime()) /
          (1000 * 60)
      );

      throw new AppError(
        `Your account is locked try again in ${lockTimeRemaining} minutes`,
        423
      );
    }

    const comparePassword = await user.comparePassword(data.password);

    if (!comparePassword) {
      const maxAttempt = 5;
      const currentAttempts = user.loginAttempts + 1;

      if (currentAttempts >= maxAttempt) {
        const lockDuration = 1000 * 60 * 30;

        await RestaurantOwner.findOneAndUpdate(
          {
            email: data.email,
          },
          {
            $set: {
              loginAttempts: currentAttempts,
              accountLockedUntil: new Date(Date.now() + lockDuration),
            },
          }
        );

        throw new AppError(
          'Your account has been locked, Try again in 30 minutes',
          423
        );
      } else {
        await RestaurantOwner.findOneAndUpdate(
          {
            email: data.email,
          },
          {
            $set: {
              loginAttempts: currentAttempts,
            },
          }
        );

        const attemptLefts = maxAttempt - currentAttempts;
        throw new AppError(
          `Invalid credentials, you have ${attemptLefts} attempts lefts`,
          400
        );
      }
    }

    const updatedUser = await RestaurantOwner.findByIdAndUpdate(user._id, {
      $set: {
        isActive: true,
        lastLogin: new Date(),
      },
      $unset: {
        loginAttempts: 1,
        accountLockedUntil: 1,
      },
    });

    if (!updatedUser) {
      throw new AppError('Unable to update user at the moment', 400);
    }

    const { accessToken, refreshToken } = user.generateAuthTokens();

    setTokenCookies(res, accessToken, refreshToken);

    await SaveRefreshToken({ userId: user._id, refreshToken });

    return {
      message: 'Login successful!',
    };
  }

  async RegisterDriver({ data }: { data: IDriverMutation['registerDriver'] }) {
    const checkIfEmailAlreadyExist = await Driver.findOne({
      email: data.email,
    });

    if (checkIfEmailAlreadyExist) {
      throw new AppError('Your Email already exist', 400);
    }

    const user = await Driver.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: RoleEnums.Driver,
      country: data.country,
      traceableLocation: {
        type: 'Point',
        coordinates: data.locationCord,
      },
    });

    user.emailOtp = generateOtp();
    user.emailisVerified = false;

    user.save();

    const formattedExpiry = dayjs(user.emailOtpExpiresAt).format(
      'hh:mm A, MMM DD YYYY'
    );

    const EmailUrl = `${config.frontendUrls.verifiyEmail}?email=${user.email}`;

    const html = EmailVerificationHTMl({
      firstname: user.firstName,
      companyName: 'JetFoods',
      expiryTime: formattedExpiry,
      otp: user.emailOtp,
      url: EmailUrl,
    });

    await emailQueue.add('emailverification', {
      to: user.email,
      subject: 'Email verification',
      body: html,
      template: 'verifyEmail',
    });

    return {
      message:
        'User created, Please verify your email to finish sign up proccess',
    };
  }

  async LoginDriver({
    res,
    data,
  }: {
    res: Response;
    data: IDriverMutation['loginDriver'];
  }) {
    const user = await Driver.findOne({
      email: data.email,
      isVerified: true,
      role: RoleEnums.Driver,
    });

    if (!user) {
      throw new AppError('Invalid credentials, Try again!', 400);
    }

    if (user.emailisVerified !== undefined && user.emailisVerified === false) {
      throw new AppError(
        'Please verify your email, before you are able to login',
        400
      );
    }

    if (
      user.accountLockedUntil &&
      new Date(user.accountLockedUntil) > new Date()
    ) {
      const lockTimeRemaining = Math.ceil(
        (new Date(user.accountLockedUntil).getTime() - new Date().getTime()) /
          (1000 * 60)
      );

      throw new AppError(
        `Your account is locked try again in ${lockTimeRemaining} minutes`,
        423
      );
    }

    const comparedPassword = await user.comparePassword(data.password);

    if (!comparedPassword) {
      const currentAttempts = user.loginAttempts + 1;
      const maxAttempts = 5;

      if (currentAttempts >= maxAttempts) {
        const lockDuration = 1000 * 60 * 30;

        await Driver.findOneAndUpdate(
          {
            email: data.email,
          },
          {
            $set: {
              loginAttempts: currentAttempts,
              accountLockedUntil: new Date(Date.now() + lockDuration),
            },
          }
        );

        throw new AppError(
          'Your account has been locked, Try again in 30 minutes',
          423
        );
      } else {
        const attemptLefts = maxAttempts - currentAttempts;

        await Driver.findOneAndUpdate(
          {
            email: data.email,
          },
          {
            $set: {
              loginAttempts: currentAttempts,
            },
          }
        );

        throw new AppError(
          `Invalid credentials, you have ${attemptLefts} attempts lefts`,
          400
        );
      }
    }

    const updatedUser = await Driver.findByIdAndUpdate(user._id, {
      $set: {
        isActive: true,
        lastLogin: new Date(),
      },
      $unset: {
        loginAttempts: 1,
        accountLockedUntil: 1,
      },
    });

    if (!updatedUser) {
      throw new AppError('Unable to update user, try again', 400);
    }

    const { accessToken, refreshToken } = user.generateAuthTokens();
    setTokenCookies(res, accessToken, refreshToken);
    await SaveRefreshToken({ userId: user._id, refreshToken });

    return {
      message: 'Login successful!',
    };
  }
}
