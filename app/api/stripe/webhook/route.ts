/**
 * Stripe Webhook Handler
 * Processes Stripe events for payments and subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import {
  verifyWebhookSignature,
  getPlanByPriceId,
} from '@/lib/stripe';
import {
  getUserByEmail,
  updateUser,
  createTransaction,
  getAllUsers,
  getTransactionsByUserId,
  type User,
  type Transaction,
} from '@/lib/db';
import {
  sendPurchaseConfirmationEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email';

// Disable body parsing - we need the raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in checkout session');
    return;
  }

  // Get customer email from session
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) {
    console.error('No customer email in checkout session');
    return;
  }

  // Find user by email
  const user = getUserByEmail(customerEmail);
  if (!user) {
    console.error('User not found:', customerEmail);
    return;
  }

  const credits = parseInt(metadata.credits || '0', 10);
  const type = metadata.type;

  if (type === 'onetime') {
    // Add credits for one-time purchase
    updateUser(user.id, {
      credits: (user.credits || 0) + credits,
    });

    // Record transaction
    createTransaction({
      userId: user.id,
      type: 'purchase',
      plan: metadata.packageId,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'PLN',
      status: 'completed',
      stripeId: session.id,
      metadata: JSON.stringify({
        packageId: metadata.packageId,
        credits,
      }),
    });

    // Send purchase confirmation email
    sendPurchaseConfirmationEmail({
      userName: user.name || 'User',
      userEmail: user.email,
      planName: metadata.packageId || 'Credit Pack',
      creditsAdded: credits,
      amountPaid: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() === 'PLN' ? 'zł' : '$',
      transactionId: session.id,
    }).catch(err => console.error('Purchase confirmation email failed:', err));

    console.log(`Added ${credits} credits to user ${user.email}`);
  } else if (type === 'subscription') {
    // Credits will be added on invoice.payment_succeeded
    // Just record the subscription start
    updateUser(user.id, {
      role: 'premium',
    });

    console.log(`Subscription started for user ${user.email}`);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;

  // Find user by customer ID in transactions or by searching
  const users = getAllUsers();
  const user = users.find((u: User) => {
    const transactions = getTransactionsByUserId(u.id);
    return transactions.some((t: Transaction) =>
      t.metadata?.includes(customerId) || t.stripeId?.includes(customerId)
    );
  });

  if (!user) {
    console.log('User not found for subscription:', subscription.id);
    return;
  }

  // Update user role based on subscription status
  if (subscription.status === 'active') {
    updateUser(user.id, {
      role: 'premium',
    });
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    updateUser(user.id, {
      role: 'user',
    });
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  // Find user and downgrade
  const users = getAllUsers();
  const user = users.find((u: User) => {
    const transactions = getTransactionsByUserId(u.id);
    return transactions.some((t: Transaction) =>
      t.metadata?.includes(subscription.id)
    );
  });

  if (user) {
    updateUser(user.id, {
      role: 'user',
    });

    // Get plan info from subscription items
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const planInfo = priceId ? getPlanByPriceId(priceId) : null;

    // Calculate end date - cast to any for flexible Stripe API version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subData = subscription as any;
    const endDate = subData.current_period_end
      ? new Date(subData.current_period_end * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'immediately';

    // Send subscription cancelled email
    sendSubscriptionCancelledEmail({
      userName: user.name || 'User',
      userEmail: user.email,
      planName: planInfo?.plan.name || 'Premium Subscription',
      endDate,
      creditsRemaining: user.credits || 0,
    }).catch(err => console.error('Subscription cancelled email error:', err));

    console.log(`Downgraded user ${user.email} to free tier`);
  }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  // Skip if not a subscription invoice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  if (!invoiceData.subscription) {
    return;
  }

  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    console.error('No customer email in invoice');
    return;
  }

  const user = getUserByEmail(customerEmail);
  if (!user) {
    console.error('User not found:', customerEmail);
    return;
  }

  // Get subscription item to determine credits
  const lineItem = invoiceData.lines?.data?.[0];
  if (!lineItem?.price?.id) {
    console.error('No price ID in invoice');
    return;
  }

  const planInfo = getPlanByPriceId(lineItem.price.id);
  if (!planInfo) {
    console.error('Unknown price ID:', lineItem.price.id);
    return;
  }

  // Add monthly credits
  const credits = planInfo.plan.credits;
  updateUser(user.id, {
    credits: (user.credits || 0) + credits,
  });

  // Record transaction
  createTransaction({
    userId: user.id,
    type: 'subscription',
    plan: planInfo.plan.id,
    amount: (invoiceData.amount_paid || 0) / 100,
    currency: invoice.currency?.toUpperCase() || 'PLN',
    status: 'completed',
    stripeId: invoice.id,
    metadata: JSON.stringify({
      planId: planInfo.plan.id,
      billingPeriod: planInfo.billingPeriod,
      credits,
      subscriptionId: invoiceData.subscription,
    }),
  });

  // Calculate next billing date (approximately 1 month)
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  // Send purchase confirmation email for subscription renewal
  sendPurchaseConfirmationEmail({
    userName: user.name || 'User',
    userEmail: user.email,
    planName: planInfo.plan.name || planInfo.plan.id,
    creditsAdded: credits,
    amountPaid: (invoiceData.amount_paid || 0) / 100,
    currency: invoice.currency?.toUpperCase() === 'PLN' ? 'zł' : '$',
    transactionId: invoice.id,
    nextBillingDate: nextBillingDate.toISOString(),
  }).catch(err => console.error('Subscription confirmation email failed:', err));

  console.log(`Added ${credits} credits to user ${user.email} for subscription`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;

  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    return;
  }

  const user = getUserByEmail(customerEmail);
  if (!user) {
    return;
  }

  // Record failed transaction
  createTransaction({
    userId: user.id,
    type: 'subscription',
    amount: (invoiceData.amount_due || 0) / 100,
    currency: invoice.currency?.toUpperCase() || 'PLN',
    status: 'failed',
    stripeId: invoice.id,
    metadata: JSON.stringify({
      subscriptionId: invoiceData.subscription,
      attemptCount: invoiceData.attempt_count,
    }),
  });

  // Get plan info for email
  const lineItem = invoiceData.lines?.data?.[0];
  const planInfo = lineItem?.price?.id ? getPlanByPriceId(lineItem.price.id) : null;

  // Calculate next retry date (Stripe retries after ~3 days)
  const nextRetryDate = new Date();
  nextRetryDate.setDate(nextRetryDate.getDate() + 3);

  // Send payment failed email
  sendPaymentFailedEmail({
    userName: user.name || 'User',
    userEmail: user.email,
    planName: planInfo?.plan.name || 'Subscription',
    amount: (invoiceData.amount_due || 0) / 100,
    currency: invoice.currency?.toUpperCase() === 'PLN' ? 'zł' : '$',
    attemptCount: invoiceData.attempt_count || 1,
    nextRetryDate: invoiceData.attempt_count < 3 ? nextRetryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : undefined,
  }).catch(err => console.error('Payment failed email error:', err));

  console.log(`Payment failed for user ${user.email}`);
}
