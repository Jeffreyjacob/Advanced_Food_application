import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import config from '../config/config';
import { Wallets } from '../models/wallet';
import { AppError } from '../utils/appError';
import { mapStripeAccountStatus } from '../utils/helper';
import {
  DocumentStatusEnum,
  RestaurantVerificationStatusEnum,
  RoleEnums,
  StripeAccountStatusEnum,
} from '../interface/enums/enums';
import { BaseUser } from '../models/baseUser';
import { Restaurant } from '../models/restaurant';
import { Driver } from '../models/driver';

const handleAccountUpdated = async (account: Stripe.Account) => {
  try {
    const wallet = await Wallets.findOne({
      stripeAccountId: account.id,
    });

    console.log('wallet updating', wallet);
    if (!wallet) {
      throw new AppError('wallet not found', 404);
    }

    const accountStatus = mapStripeAccountStatus(account);

    console.log(accountStatus);

    const updateData = {
      accountStatus: accountStatus.status,
      reasons:
        accountStatus.status === StripeAccountStatusEnum.enabled
          ? []
          : accountStatus.reasons,
      payoutsEnabled: account.payouts_enabled || false,
      chargesEnabled: account.charges_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirements: {
        currentDeadline: account.requirements?.current_deadline
          ? new Date(account.requirements.current_deadline * 1000)
          : undefined,
        disabledReason: account.requirements?.disabled_reason || undefined,
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
      },
    };

    await Wallets.findByIdAndUpdate(wallet._id, updateData);
    if (accountStatus.status === StripeAccountStatusEnum.enabled) {
      console.log('updating restaurant wallet status');
      const findUser = await BaseUser.findOne({
        _id: wallet.userId,
      });

      if (!findUser) {
        throw new AppError('User not found ', 404);
      }

      if (findUser.role === RoleEnums.Restaurant_Owner) {
        const updateRestaurant = await Restaurant.findOneAndUpdate(
          {
            owner: findUser._id,
          },
          {
            $set: {
              walletSetup: true,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!updateRestaurant) {
          throw new AppError('Unable to update restaurant', 400);
        }

        const checkIfAllRestaurantDocumentHasVerified = Object.entries(
          updateRestaurant.documents
        ).every(([key, value]) => value.status === DocumentStatusEnum.Approved);

        if (
          checkIfAllRestaurantDocumentHasVerified &&
          updateRestaurant.walletSetup === true
        ) {
          updateRestaurant.verificationStatus =
            RestaurantVerificationStatusEnum.Approved;
          updateRestaurant.isLive = true;

          await updateRestaurant.save();
        }
      } else if (findUser.role === RoleEnums.Driver) {
        const findDriver = await Driver.findOneAndUpdate(
          {
            _id: findUser._id,
          },
          {
            $set: {
              walletSetup: true,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!findDriver) {
          throw new AppError("Can't updated driver at the moment", 400);
        }
      }
    }
  } catch (error: any) {
    console.error('Error handling account update:', error);
  }
};

const handleCapabilityUpdated = async (capability: Stripe.Capability) => {
  try {
    const account = await stripe.accounts.retrieve(
      capability.account as string
    );
    await handleAccountUpdated(account);
  } catch (error: any) {
    console.error('Error handling capability update:', error);
  }
};

const handleBalanceAvailable = async (
  balance: Stripe.Balance,
  event: Stripe.Event
) => {
  try {
    const stripeAccountId = event.account;

    const wallet = await Wallets.findOne({
      stripeAccountId: stripeAccountId,
    });

    if (!wallet) return;

    let totalAvaliable = 0;
    let totalPending = 0;

    balance.available.forEach((bal) => {
      totalAvaliable += bal.amount;
    });

    balance.pending.forEach((bal) => {
      totalPending += bal.amount;
    });

    await Wallets.findByIdAndUpdate(wallet._id, {
      $set: {
        'balance.available': totalAvaliable / 100,
        'balance.pending': totalPending / 100,
        'balance.lastUpdated': new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error handling balance available:', error);
  }
};

export const handleStripeWebhookConnect = async (
  req: Request,
  res: Response
) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;
  console.log(config.stripe.Stripe_webhook_connect_secret);
  const endpointSecret = config.stripe.Stripe_webhook_connect_secret as string;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret
    );
  } catch (error: any) {
    console.log(`Webhook signature verification failed.`, error);
    return res.status(400).send(`Webhook Error: ${error}`);
  }

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object as Stripe.Capability);
        break;

      case 'balance.available':
        await handleBalanceAvailable(
          event.data.object as Stripe.Balance,
          event
        );
        break;
    }

    return res.status(200).json({ recieved: true });
  } catch (error: any) {
    console.error('Webhook handler failed:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};
