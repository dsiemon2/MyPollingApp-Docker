import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    const eventType = event.event_type;

    logger.info({ eventType, eventId: event.id }, 'PayPal webhook received');

    // Get PayPal config for verification
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'paypal', isEnabled: true }
    });

    if (!gateway) {
      logger.warn({}, 'PayPal webhook received but gateway not configured');
      return res.status(200).json({ received: true });
    }

    // Handle different event types
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED': {
        await handleOrderApproved(event.resource);
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        await handlePaymentCompleted(event.resource);
        break;
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        await handleSubscriptionActivated(event.resource);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        await handleSubscriptionCancelled(event.resource);
        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        await handleSubscriptionExpired(event.resource);
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        await handleSubscriptionSuspended(event.resource);
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        await handleSaleCompleted(event.resource);
        break;
      }

      default:
        logger.info({ eventType }, 'Unhandled PayPal event type');
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'PayPal webhook handler error');
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleOrderApproved(resource: any): Promise<void> {
  const orderId = resource.id;
  const customReference = resource.purchase_units?.[0]?.custom_id;

  if (!customReference) {
    logger.warn({ orderId }, 'No custom reference in PayPal order');
    return;
  }

  // Parse userId and planId from custom reference (format: userId:planId)
  const [userId, planId] = customReference.split(':');

  if (!userId) {
    logger.warn({ orderId, customReference }, 'Invalid custom reference format');
    return;
  }

  logger.info({ orderId, userId, planId }, 'PayPal order approved');
}

async function handlePaymentCompleted(resource: any): Promise<void> {
  const captureId = resource.id;
  const customReference = resource.custom_id;

  if (!customReference) {
    logger.info({ captureId }, 'Payment completed without custom reference');
    return;
  }

  const [userId, planId] = customReference.split(':');

  if (!userId) {
    return;
  }

  // Determine plan type
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
      paymentGateway: 'paypal'
    },
    create: {
      userId,
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      paymentGateway: 'paypal'
    }
  });

  logger.info({ userId, planType, captureId }, 'PayPal payment completed - subscription activated');
}

async function handleSubscriptionActivated(resource: any): Promise<void> {
  const subscriptionId = resource.id;
  const customReference = resource.custom_id;

  if (!customReference) {
    logger.warn({ subscriptionId }, 'No custom reference in subscription');
    return;
  }

  const [userId, planId] = customReference.split(':');

  if (!userId) {
    return;
  }

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
      paymentGateway: 'paypal'
    },
    create: {
      userId,
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      paymentGateway: 'paypal'
    }
  });

  logger.info({ subscriptionId, userId }, 'PayPal subscription activated');
}

async function handleSubscriptionCancelled(resource: any): Promise<void> {
  const subscriptionId = resource.id;
  const customReference = resource.custom_id;

  if (!customReference) {
    return;
  }

  const [userId] = customReference.split(':');

  if (!userId) {
    return;
  }

  await prisma.subscription.updateMany({
    where: { userId, paymentGateway: 'paypal' },
    data: {
      status: 'CANCELLED',
      canceledAt: new Date()
    }
  });

  logger.info({ subscriptionId, userId }, 'PayPal subscription cancelled');
}

async function handleSubscriptionExpired(resource: any): Promise<void> {
  const subscriptionId = resource.id;
  const customReference = resource.custom_id;

  if (!customReference) {
    return;
  }

  const [userId] = customReference.split(':');

  if (!userId) {
    return;
  }

  await prisma.subscription.updateMany({
    where: { userId, paymentGateway: 'paypal' },
    data: { status: 'EXPIRED' }
  });

  logger.info({ subscriptionId, userId }, 'PayPal subscription expired');
}

async function handleSubscriptionSuspended(resource: any): Promise<void> {
  const subscriptionId = resource.id;
  const customReference = resource.custom_id;

  if (!customReference) {
    return;
  }

  const [userId] = customReference.split(':');

  if (!userId) {
    return;
  }

  await prisma.subscription.updateMany({
    where: { userId, paymentGateway: 'paypal' },
    data: { status: 'PAST_DUE' }
  });

  logger.info({ subscriptionId, userId }, 'PayPal subscription suspended');
}

async function handleSaleCompleted(resource: any): Promise<void> {
  logger.info({ saleId: resource.id, amount: resource.amount?.total }, 'PayPal sale completed');
}
