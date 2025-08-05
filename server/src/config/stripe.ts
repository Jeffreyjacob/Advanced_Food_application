import Stripe from 'stripe';
import config from './config';

export const stripe = new Stripe(config.stripe.stripe_secret_key!, {
  apiVersion: '2025-06-30.basil',
});
