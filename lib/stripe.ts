/**
 * Stripe payment integration for Pixelift
 * Handles subscriptions, one-time payments, and webhooks
 */

// Note: Install stripe package first: npm install stripe

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  credits: number;
  features: string[];
  stripePriceId?: string;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'For occasional users',
    price: 0,
    currency: 'USD',
    interval: 'month',
    credits: 10,
    features: [
      '10 credits/month',
      'Basic image upscaling',
      'Background removal',
      'Low resolution downloads',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For regular users',
    price: 19,
    currency: 'USD',
    interval: 'month',
    credits: 200,
    features: [
      '200 credits/month',
      'All image tools',
      'High resolution downloads',
      'Priority processing',
      'No watermarks',
      'Email support',
    ],
    stripePriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and businesses',
    price: 99,
    currency: 'USD',
    interval: 'month',
    credits: 1000,
    features: [
      '1000 credits/month',
      'All image tools',
      'Original resolution downloads',
      'API access',
      'Batch processing',
      'Priority support',
      'Custom integrations',
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
  },
};

/**
 * Initialize Stripe client (add this when installing stripe)
 *
 * import Stripe from 'stripe';
 *
 * export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 *   apiVersion: '2023-10-16',
 *   typescript: true,
 * });
 */

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string } | { error: string }> {
  try {
    const plan = PRICING_PLANS[params.planId];

    if (!plan || !plan.stripePriceId) {
      return { error: 'Invalid plan selected' };
    }

    // TODO: Implement with actual Stripe SDK
    // const session = await stripe.checkout.sessions.create({
    //   customer_email: params.userEmail,
    //   client_reference_id: params.userId,
    //   payment_method_types: ['card'],
    //   mode: 'subscription',
    //   line_items: [
    //     {
    //       price: plan.stripePriceId,
    //       quantity: 1,
    //     },
    //   ],
    //   success_url: params.successUrl,
    //   cancel_url: params.cancelUrl,
    //   metadata: {
    //     userId: params.userId,
    //     planId: params.planId,
    //   },
    // });

    // return { sessionId: session.id, url: session.url! };

    // Placeholder for demo
    return {
      sessionId: 'demo_session_id',
      url: params.successUrl,
    };
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement with actual Stripe SDK
    // const event = stripe.webhooks.constructEvent(
    //   payload,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET!
    // );

    // switch (event.type) {
    //   case 'checkout.session.completed':
    //     await handleCheckoutCompleted(event.data.object);
    //     break;
    //   case 'customer.subscription.updated':
    //     await handleSubscriptionUpdated(event.data.object);
    //     break;
    //   case 'customer.subscription.deleted':
    //     await handleSubscriptionCanceled(event.data.object);
    //     break;
    //   case 'invoice.payment_succeeded':
    //     await handlePaymentSucceeded(event.data.object);
    //     break;
    //   case 'invoice.payment_failed':
    //     await handlePaymentFailed(event.data.object);
    //     break;
    // }

    return { success: true };
  } catch (error: any) {
    console.error('Webhook error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string
): Promise<{ url: string } | { error: string }> {
  try {
    // TODO: Implement with actual Stripe SDK
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: customerId,
    //   return_url: returnUrl,
    // });

    // return { url: session.url };

    // Placeholder
    return { url: returnUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Credit packages for one-time purchases
 */
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  stripePriceId?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits_50',
    name: '50 Credits',
    credits: 50,
    price: 9,
    currency: 'USD',
    stripePriceId: process.env.STRIPE_CREDITS_50_PRICE_ID,
  },
  {
    id: 'credits_150',
    name: '150 Credits',
    credits: 150,
    price: 24,
    currency: 'USD',
    stripePriceId: process.env.STRIPE_CREDITS_150_PRICE_ID,
  },
  {
    id: 'credits_500',
    name: '500 Credits',
    credits: 500,
    price: 69,
    currency: 'USD',
    stripePriceId: process.env.STRIPE_CREDITS_500_PRICE_ID,
  },
];
