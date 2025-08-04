import mongoose, { Mongoose } from 'mongoose';
import {
  RoleEnums,
  StripeAccountStatusEnum,
  StripeAccountType,
} from '../interface/enums/enums';
import { IWalletMutation } from '../interface/interface/interface';
import { RestaurantOwner } from '../models/restaurantOwner';
import { AppError } from '../utils/appError';
import { stripe } from '../config/stripe';
import { Wallets } from '../models/wallet';
import { countriesISO } from '../utils/countryIso';
import config from '../config/config';
import { Request } from 'express';
import { IBaseUser } from '../interface/models/models';
import { Driver } from '../models/driver';

export class WalletServices {
  async createStripeConnectAccount({
    data,
  }: {
    data: IWalletMutation['createStripeConnectAccount'];
  }) {
    if (data.role === RoleEnums.Restaurant_Owner) {
      const findRestaurantOwner = await RestaurantOwner.findOne({
        _id: new mongoose.Types.ObjectId(data.userId),
      });

      if (!findRestaurantOwner) {
        throw new AppError("restaurant owner can't be found", 404);
      }

      // find country ISO
      const countryISO = countriesISO.find(
        (country) =>
          country.name.toLowerCase() ===
          findRestaurantOwner.country.toLowerCase()
      );

      // create stripe account for user

      const account = await stripe.accounts.create({
        type: 'express',
        email: findRestaurantOwner.email,
        country: countryISO?.code,
        default_currency: 'usd',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        individual: {
          first_name: findRestaurantOwner.firstName,
          last_name: findRestaurantOwner.lastName,
          email: findRestaurantOwner.email,
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
      });

      //create wallet record in database
      const wallet = await Wallets.create({
        userId: findRestaurantOwner._id,
        stripeAccountId: account.id,
        accountType: StripeAccountType.express,
        currency: 'usd',
        country: findRestaurantOwner.country,
        balance: {
          available: 0,
          pending: 0,
          lastUpdated: new Date(),
        },
        accountStatus: StripeAccountStatusEnum.pending,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
          pendingVerification: account.requirements?.pending_verification || [],
        },
      });

      // updated restaurant owner stripeAccountId

      findRestaurantOwner.stripeAccountId = account.id;
      await findRestaurantOwner.save();

      // generate onboarding url to finish boarding process and verify their account

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${config.frontendUrls.baseUrl}/onboardingLink`,
        return_url: `${config.frontendUrls.baseUrl}`,
        type: 'account_onboarding',
      });

      return {
        message: 'Wallet created successfully',
        data: accountLink.url,
      };
    } else if (data.role === RoleEnums.Driver) {
      const findDriver = await Driver.findOne({
        _id: new mongoose.Types.ObjectId(data.userId),
      });

      if (!findDriver) {
        throw new AppError("driver owner can't be found", 404);
      }

      // find country ISO
      const countryISO = countriesISO.find(
        (country) =>
          country.name.toLowerCase() === findDriver.country.toLowerCase()
      );

      // create stripe account for user

      const account = await stripe.accounts.create({
        type: 'express',
        email: findDriver.email,
        country: countryISO?.code,
        default_currency: 'usd',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        individual: {
          first_name: findDriver.firstName,
          last_name: findDriver.lastName,
          email: findDriver.email,
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
      });

      //create wallet record in database
      const wallet = await Wallets.create({
        userId: findDriver._id,
        stripeAccountId: account.id,
        accountType: StripeAccountType.express,
        currency: 'usd',
        country: findDriver.country,
        balance: {
          available: 0,
          pending: 0,
          lastUpdated: new Date(),
        },
        accountStatus: StripeAccountStatusEnum.pending,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
          pendingVerification: account.requirements?.pending_verification || [],
        },
      });

      // updated restaurant owner stripeAccountId

      findDriver.stripeAccountId = account.id;
      await findDriver.save();

      // generate onboarding url to finish boarding process and verify their account

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${config.frontendUrls.baseUrl}/onboardingLink`,
        return_url: `${config.frontendUrls.baseUrl}`,
        type: 'account_onboarding',
      });

      return {
        message: 'Wallet created successfully',
        data: accountLink.url,
      };
    }
  }

  async OnBoardingLink({ data }: { data: IWalletMutation['onBoardingLink'] }) {
    let stripeAccountId: string = '';

    if (data.role === RoleEnums.Restaurant_Owner) {
      const findRestaurantOwner = await RestaurantOwner.findOne({
        _id: new mongoose.Types.ObjectId(data.userId),
      });

      if (!findRestaurantOwner) {
        throw new AppError('restaurant owner not found', 404);
      }

      stripeAccountId = findRestaurantOwner.stripeAccountId;
    } else if (data.role === RoleEnums.Driver) {
      const findDriver = await Driver.findOne({
        _id: new mongoose.Types.ObjectId(data.userId),
      });

      if (!findDriver) {
        throw new AppError('driver was not found', 404);
      }

      stripeAccountId = findDriver.stripeAccountId;
    }

    const account = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${config.frontendUrls.baseUrl}/onboardingLink`,
      return_url: `${config.frontendUrls.baseUrl}`,
      type: 'account_onboarding',
    });

    return {
      data: account.url,
    };
  }

  async generateStripeWallet({ req }: { req: Request }) {
    if (req.user.role === RoleEnums.Restaurant_Owner) {
      const findRestaurantOwner = await RestaurantOwner.findOne({
        _id: new mongoose.Types.ObjectId(req.user._id),
      });

      if (!findRestaurantOwner) {
        throw new AppError("restaurant can't be found", 404);
      }

      const createLoginUrl = await stripe.accounts.createLoginLink(
        findRestaurantOwner.stripeAccountId
      );

      return createLoginUrl.url;
    } else if (req.user.role === RoleEnums.Driver) {
      const findDriver = await Driver.findOne({
        _id: new mongoose.Types.ObjectId(req.user._id),
      });

      if (!findDriver) {
        throw new AppError('Drive was not found', 404);
      }

      const createLoginUrl = await stripe.accounts.createLoginLink(
        findDriver.stripeAccountId
      );

      return createLoginUrl.url;
    }
  }

  async deleteWallet({
    userId,
  }: {
    userId: IBaseUser['_id'];
  }): Promise<{ message: string }> {
    const wallet = await Wallets.findOne({ userId });

    if (!wallet) {
      throw new AppError('wallet not found', 404);
    }

    const { stripeAccountId } = wallet;

    const account = await stripe.accounts.retrieve(stripeAccountId);

    if (account.charges_enabled) {
      const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });

      const hasPendingBalance =
        balance.pending.some((item) => item.amount > 0) ||
        balance.available.some((item) => item.amount > 0);

      if (hasPendingBalance) {
        throw new AppError(
          'Can not delete with pending balance. Please wait for payout ',
          400
        );
      }

      const deletedAccount = await stripe.accounts.del(stripeAccountId);

      await Wallets.deleteOne({ userId });
    }

    return {
      message: 'User wallet has been deleted',
    };
  }
}
