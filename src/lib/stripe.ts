import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-09-30.clover",
  });

  return stripeClient;
};

export const getSiteUrl = () => {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const getStripeWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
};

export type StripeClient = Stripe;
