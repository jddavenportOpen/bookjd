import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion })
  : null;

export function isStripeConfigured(): boolean {
  return !!stripeSecretKey;
}
