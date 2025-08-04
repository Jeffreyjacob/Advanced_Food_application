import Stripe from 'stripe';
import { StripeAccountStatusEnum } from '../interface/enums/enums';

export const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000);
};

export const mapStripeAccountStatus = (
  account: Stripe.Account
): StripeAccountStatusEnum => {
  if (!account.charges_enabled && !account.payouts_enabled) {
    return StripeAccountStatusEnum.disabled;
  }

  if (account.requirements?.disabled_reason) {
    return StripeAccountStatusEnum.disabled;
  }

  if (
    account.requirements?.currently_due?.length ||
    account.requirements?.past_due?.length
  ) {
    return StripeAccountStatusEnum.restricted;
  }

  if (account.charges_enabled && account.payouts_enabled) {
    return StripeAccountStatusEnum.enabled;
  }

  return StripeAccountStatusEnum.pending;
};
