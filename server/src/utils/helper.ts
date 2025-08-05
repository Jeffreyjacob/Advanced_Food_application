import Stripe from 'stripe';
import { StripeAccountStatusEnum } from '../interface/enums/enums';

export const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000);
};

export const mapStripeAccountStatus = (
  account: Stripe.Account
): { status: StripeAccountStatusEnum; reasons: string[] } => {
  const reasons: string[] = [];

  if (account.charges_enabled && account.payouts_enabled) {
    if (account.requirements?.pending_verification?.length) {
      reasons.push('Account enabled but has pending verification');
      return { status: StripeAccountStatusEnum.pending, reasons };
    }

    if (
      account.requirements?.currently_due?.length ||
      account.requirements?.past_due?.length
    ) {
      reasons.push('Account enabled but has outstanding requirements');
      return { status: StripeAccountStatusEnum.restricted, reasons };
    }

    return { status: StripeAccountStatusEnum.enabled, reasons };
  }

  if (account.requirements?.disabled_reason) {
    reasons.push(
      `Account disabled due to:`,
      account.requirements.disabled_reason
    );

    switch (account.requirements.disabled_reason) {
      case 'requirements.past_due':
        return { status: StripeAccountStatusEnum.restricted, reasons };
      case 'requirements.pending_verification':
        return { status: StripeAccountStatusEnum.pending, reasons };
      case 'rejected.fraud':
      case 'rejected.listed':
      case 'rejected.terms_of_service':
        return { status: StripeAccountStatusEnum.disabled, reasons };
      default:
        return { status: StripeAccountStatusEnum.disabled, reasons };
    }
  }

  if (account.requirements?.past_due?.length) {
    reasons.push('Account has past due requirments');
    return { status: StripeAccountStatusEnum.restricted, reasons };
  }

  if (account.requirements?.currently_due?.length) {
    reasons.push(
      `Account has current requirements ${account.requirements.currently_due.join(' ')}`
    );
    return { status: StripeAccountStatusEnum.restricted, reasons };
  }

  // Check partial enablement
  if (account.charges_enabled || account.payouts_enabled) {
    reasons.push('Account partially enabled');
    return { status: StripeAccountStatusEnum.pending, reasons };
  }

  return { status: StripeAccountStatusEnum.disabled, reasons };
};
