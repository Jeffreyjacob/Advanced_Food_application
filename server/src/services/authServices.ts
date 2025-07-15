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
      country: data.password,
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

    await emailQueue.add('emailverification', {
      to: customer.email,
      subject: 'Email verification',
      body: html,
      template: 'verifyEmail',
    });

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
}
