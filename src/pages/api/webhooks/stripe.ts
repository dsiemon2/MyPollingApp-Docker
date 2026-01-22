import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';
import Stripe from 'stripe';
import {
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail
} from '@/services/email.service';

// Disable body parsing for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      logger.warn({}, 'Missing Stripe signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Get Stripe config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'stripe', isEnabled: true }
    });

    if (!gateway?.secretKey || !gateway?.webhookSecret) {
      logger.error({}, 'Stripe webhook not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const stripe = new Stripe(gateway.secretKey, {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion
    });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, gateway.webhookSecret);
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    logger.info({ eventType: event.type, eventId: event.id }, 'Stripe webhook received');

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        logger.info({ eventType: event.type }, 'Unhandled event type');
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Stripe webhook handler error');
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata;
  const userId = metadata?.userId;
  const planId = metadata?.planId;

  if (!userId) {
    logger.warn({ sessionId: session.id }, 'No userId in checkout session metadata');
    return;
  }

  // Determine plan type from metadata or fetch from plan
  let planType: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER';
  if (planId) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (plan) {
      const name = plan.name.toUpperCase();
      if (['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(name)) {
        planType = name as typeof planType;
      }
    }
  }

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      paymentGateway: 'stripe'
    },
    create: {
      userId,
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      paymentGateway: 'stripe'
    }
  });

  logger.info({ userId, planType, sessionId: session.id }, 'Checkout completed - subscription activated');

  // Send subscription activated email
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    sendSubscriptionActivatedEmail(user, planType).catch((err) => {
      logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'Failed to send subscription email');
    });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  // Find subscription by Stripe customer ID
  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!userSubscription) {
    logger.warn({ customerId }, 'No subscription found for Stripe customer');
    return;
  }

  // Map Stripe status to our status
  let status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING' = 'ACTIVE';
  switch (subscription.status) {
    case 'active':
      status = 'ACTIVE';
      break;
    case 'past_due':
      status = 'PAST_DUE';
      break;
    case 'canceled':
      status = 'CANCELLED';
      break;
    case 'trialing':
      status = 'TRIALING';
      break;
  }

  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: {
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });

  logger.info({ subscriptionId: subscription.id, status }, 'Subscription updated');
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true, subscriptionPlan: true }
  });

  if (!userSubscription) {
    logger.warn({ customerId }, 'No subscription found for cancelled subscription');
    return;
  }

  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: {
      status: 'CANCELLED',
      canceledAt: new Date()
    }
  });

  logger.info({ subscriptionId: subscription.id }, 'Subscription cancelled');

  // Send cancellation email
  if (userSubscription.user) {
    const endDate = userSubscription.currentPeriodEnd || new Date();
    const planName = userSubscription.subscriptionPlan?.displayName || userSubscription.plan;
    sendSubscriptionCancelledEmail(userSubscription.user, planName, endDate).catch((err) => {
      logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'Failed to send cancellation email');
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true, subscriptionPlan: true }
  });

  if (!userSubscription) {
    return;
  }

  // Update subscription status to active on successful payment
  if (userSubscription.status === 'PAST_DUE') {
    await prisma.subscription.update({
      where: { id: userSubscription.id },
      data: { status: 'ACTIVE' }
    });
  }

  logger.info({ invoiceId: invoice.id, customerId }, 'Invoice payment succeeded');

  // Send payment receipt email
  if (userSubscription.user && invoice.amount_paid) {
    const amount = invoice.amount_paid / 100; // Convert from cents
    const planName = userSubscription.subscriptionPlan?.displayName || userSubscription.plan;
    sendPaymentReceiptEmail(userSubscription.user, amount, planName, invoice.id).catch((err) => {
      logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'Failed to send receipt email');
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true, subscriptionPlan: true }
  });

  if (!userSubscription) {
    return;
  }

  await prisma.subscription.update({
    where: { id: userSubscription.id },
    data: { status: 'PAST_DUE' }
  });

  logger.warn({ invoiceId: invoice.id, customerId }, 'Invoice payment failed');

  // Send payment failed email
  if (userSubscription.user) {
    const planName = userSubscription.subscriptionPlan?.displayName || userSubscription.plan;
    sendPaymentFailedEmail(userSubscription.user, planName).catch((err) => {
      logger.warn({ error: err instanceof Error ? err.message : String(err) }, 'Failed to send payment failed email');
    });
  }
}
