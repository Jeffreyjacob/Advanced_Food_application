import dayjs from 'dayjs';
import { RoleEnums } from '../interface/enums/enums';
import {
  IAuthenticationMutation,
  ICustomerMutation,
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
        (new Date(user.accountLockedUntil).getTime() - new Date().getTime()) /
          (1000 * 60)
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
          400
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
}
