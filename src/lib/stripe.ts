import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

export const PLANS = {
  free: {
    id: "free",
    name: "Gratis",
    description: "Para empezar a buscar tu próximo hogar",
    price: 0,
    currency: "ars",
    interval: "month" as const,
    features: {
      maxSearchAlerts: 2,
      maxFilters: 2,
      realTimeAlerts: false,
      tenantProfile: false,
      rentCalculator: false,
      prioritySupport: false,
    },
    stripePriceId: null,
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Todo lo que necesitás para encontrar y gestionar tu alquiler",
    price: 4999,
    currency: "ars",
    interval: "month" as const,
    features: {
      maxSearchAlerts: -1,
      maxFilters: -1,
      realTimeAlerts: true,
      tenantProfile: true,
      rentCalculator: true,
      prioritySupport: true,
    },
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || "price_premium_monthly",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para propietarios y profesionales inmobiliarios",
    price: 9999,
    currency: "ars",
    interval: "month" as const,
    features: {
      maxSearchAlerts: -1,
      maxFilters: -1,
      realTimeAlerts: true,
      tenantProfile: true,
      rentCalculator: true,
      prioritySupport: true,
      multiProperty: true,
      analytics: true,
    },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type PlanFeatures = {
  maxSearchAlerts: number;
  maxFilters: number;
  realTimeAlerts: boolean;
  tenantProfile: boolean;
  rentCalculator: boolean;
  prioritySupport: boolean;
  multiProperty?: boolean;
  analytics?: boolean;
};

export async function getStripeCustomerByEmail(email: string) {
  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data[0] || null;
}

export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
) {
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
  });
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function getCustomerSubscriptions(customerId: string) {
  return stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
}

export async function constructWebhookEvent(
  payload: Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) {
      return key as PlanId;
    }
  }
  return null;
}

export function getPlanFeatures(planId: PlanId): PlanFeatures {
  return PLANS[planId].features;
}
