/**
 * Stripe Integration for Pixelift
 * Handles subscriptions, one-time payments, and customer management
 */

import Stripe from 'stripe';

// Lazy-loaded Stripe instance to avoid build-time initialization
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Backward compatibility - lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

// ==========================================
// Subscription Plans Configuration
// ==========================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  credits: number;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    monthlyPrice: 1900, // 19 PLN in grosze
    yearlyPrice: 6840, // 68.40 PLN/year (5.70 PLN/month)
    monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    yearlyPriceId: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
    features: [
      '100 kredytów miesięcznie',
      'Upscaling 2x-4x',
      'Podstawowe poprawa jakości',
      'Email support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    monthlyPrice: 4900, // 49 PLN
    yearlyPrice: 17640, // 176.40 PLN/year (14.70 PLN/month)
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    features: [
      '500 kredytów miesięcznie',
      'Upscaling do 8x',
      'Zaawansowana poprawa jakości',
      'Face enhancement',
      'Priority processing',
      'Priority support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    credits: 2000,
    monthlyPrice: 14900, // 149 PLN
    yearlyPrice: 53640, // 536.40 PLN/year (44.70 PLN/month)
    monthlyPriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
    yearlyPriceId: process.env.STRIPE_PRICE_BUSINESS_YEARLY || '',
    features: [
      '2000 kredytów miesięcznie',
      'Wszystkie funkcje Pro',
      'API access',
      'Batch processing',
      'Dedicated support',
      'Custom presets',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 30000,
    monthlyPrice: 49900, // 499 PLN
    yearlyPrice: 179640, // 1796.40 PLN/year (149.70 PLN/month)
    monthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    yearlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
    features: [
      '30 000 kredytów miesięcznie',
      'Wszystkie funkcje Business',
      'White-label',
      'SLA 99.9%',
      'Dedykowany manager',
      'Custom integrations',
    ],
  },
};

// ==========================================
// One-Time Credit Packages
// ==========================================

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in grosze (PLN cents)
  priceId: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 15,
    price: 999, // 9.99 PLN
    priceId: process.env.STRIPE_PRICE_CREDITS_15 || '',
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 50,
    price: 2999, // 29.99 PLN
    priceId: process.env.STRIPE_PRICE_CREDITS_50 || '',
  },
  {
    id: 'standard',
    name: 'Standard',
    credits: 100,
    price: 4999, // 49.99 PLN
    priceId: process.env.STRIPE_PRICE_CREDITS_100 || '',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 250,
    price: 9999, // 99.99 PLN
    priceId: process.env.STRIPE_PRICE_CREDITS_250 || '',
  },
  {
    id: 'business',
    name: 'Business',
    credits: 1000,
    price: 29999, // 299.99 PLN
    priceId: process.env.STRIPE_PRICE_CREDITS_1000 || '',
  },
];

// ==========================================
// Types
// ==========================================

export type BillingPeriod = 'monthly' | 'yearly';
export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

// ==========================================
// Customer Management
// ==========================================

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Search for existing customer by metadata userId
  const existingCustomers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Search by email as fallback
  const customersByEmail = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customersByEmail.data.length > 0) {
    // Update existing customer with userId metadata
    await stripe.customers.update(customersByEmail.data[0].id, {
      metadata: { userId },
    });
    return customersByEmail.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

/**
 * Get customer by ID
 */
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  return await stripe.customers.retrieve(customerId);
}

/**
 * Update customer details
 */
export async function updateCustomer(
  customerId: string,
  data: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, data);
}

// ==========================================
// Subscription Checkout
// ==========================================

/**
 * Create a checkout session for subscription
 */
export async function createSubscriptionCheckout(
  customerId: string,
  planId: SubscriptionPlanId,
  billingPeriod: BillingPeriod,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const priceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;

  if (!priceId) {
    throw new Error(`Price ID not configured for ${planId} ${billingPeriod}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card', 'blik', 'p24'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      planId,
      billingPeriod,
      credits: plan.credits.toString(),
      type: 'subscription',
    },
    subscription_data: {
      metadata: {
        planId,
        billingPeriod,
        credits: plan.credits.toString(),
      },
    },
    locale: 'pl',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    tax_id_collection: {
      enabled: true,
    },
  });

  return session;
}

// ==========================================
// One-Time Purchase Checkout
// ==========================================

/**
 * Create a checkout session for one-time credit purchase
 */
export async function createCreditPurchaseCheckout(
  customerId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);

  if (!creditPackage) {
    throw new Error(`Invalid package: ${packageId}`);
  }

  if (!creditPackage.priceId) {
    throw new Error(`Price ID not configured for package ${packageId}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card', 'blik', 'p24'],
    line_items: [
      {
        price: creditPackage.priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      packageId,
      credits: creditPackage.credits.toString(),
      type: 'onetime',
    },
    locale: 'pl',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    tax_id_collection: {
      enabled: true,
    },
  });

  return session;
}

// ==========================================
// Customer Portal
// ==========================================

/**
 * Create a customer portal session for managing subscription
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// ==========================================
// Subscription Management
// ==========================================

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });

  return subscriptions.data;
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a subscription that was set to cancel at period end
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: SubscriptionPlanId,
  billingPeriod: BillingPeriod
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = SUBSCRIPTION_PLANS[newPlanId];

  if (!plan) {
    throw new Error(`Invalid plan: ${newPlanId}`);
  }

  const newPriceId = billingPeriod === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;

  if (!newPriceId) {
    throw new Error(`Price ID not configured for ${newPlanId} ${billingPeriod}`);
  }

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      planId: newPlanId,
      billingPeriod,
      credits: plan.credits.toString(),
    },
  });
}

// ==========================================
// Payment History
// ==========================================

/**
 * Get payment history for a customer
 */
export async function getPaymentHistory(
  customerId: string,
  limit: number = 10
): Promise<Stripe.PaymentIntent[]> {
  const paymentIntents = await stripe.paymentIntents.list({
    customer: customerId,
    limit,
  });

  return paymentIntents.data;
}

/**
 * Get invoice history for a customer
 */
export async function getInvoiceHistory(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

// ==========================================
// Refunds
// ==========================================

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
}

// ==========================================
// Webhook Handling
// ==========================================

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'payment_intent', 'customer'],
  });
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Format price in PLN
 */
export function formatPrice(priceInGrosze: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(priceInGrosze / 100);
}

/**
 * Calculate savings for yearly billing
 */
export function calculateYearlySavings(planId: SubscriptionPlanId): {
  monthlyTotal: number;
  yearlyTotal: number;
  savings: number;
  savingsPercent: number;
} {
  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const monthlyTotal = plan.monthlyPrice * 12;
  const yearlyTotal = plan.yearlyPrice;
  const savings = monthlyTotal - yearlyTotal;
  const savingsPercent = Math.round((savings / monthlyTotal) * 100);

  return {
    monthlyTotal,
    yearlyTotal,
    savings,
    savingsPercent,
  };
}

/**
 * Get plan by price ID
 */
export function getPlanByPriceId(priceId: string): {
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
} | null {
  for (const [, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.monthlyPriceId === priceId) {
      return { plan, billingPeriod: 'monthly' };
    }
    if (plan.yearlyPriceId === priceId) {
      return { plan, billingPeriod: 'yearly' };
    }
  }

  return null;
}

/**
 * Get credit package by price ID
 */
export function getPackageByPriceId(priceId: string): CreditPackage | null {
  return CREDIT_PACKAGES.find((p) => p.priceId === priceId) || null;
}
