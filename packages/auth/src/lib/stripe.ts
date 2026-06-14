import { env } from "@job-portal/env/server";
import Stripe from "stripe";

// Lazy-initialize Stripe to allow development without API keys
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Set it to enable Stripe payment functionality.",
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeInstance;
}

export const stripe = {
  checkout: {
    sessions: {
      create: (params: any) => getStripe().checkout.sessions.create(params),
    },
  },
  webhooks: {
    constructEvent: (payload: string | Buffer, signature: string) =>
      getStripe().webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET || "",
      ),
  },
} as any;

export async function createCheckoutSession(params: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.customerId,
    metadata: params.metadata,
  });

  return session;
}

export async function createSubscriptionCheckout(params: {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.customerId,
    metadata: params.metadata,
  });

  return session;
}

export async function constructWebhookEvent(payload: string | Buffer, signature: string) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured. Stripe webhook verification is disabled.",
    );
  }
  return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
