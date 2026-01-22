import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    const eventType = notification.eventType;

    logger.info({ eventType }, 'Authorize.net webhook received');

    // Get Authorize.net config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'authorize', isEnabled: true }
    });

    if (!gateway) {
      logger.warn({}, 'Authorize.net webhook received but gateway not configured');
      return res.status(200).json({ received: true });
    }

    // Verify signature if webhook secret is configured
    if (gateway.webhookSecret) {
      const signature = req.headers['x-anet-signature'] as string;
      if (signature) {
        const hash = signature.replace('sha512=', '');
        const body = JSON.stringify(req.body);
        const expectedHash = crypto
          .createHmac('sha512', gateway.webhookSecret)
          .update(body)
          .digest('hex')
          .toUpperCase();

        if (hash.toUpperCase() !== expectedHash) {
          logger.warn({}, 'Invalid Authorize.net webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
    }

    // Handle different event types
    switch (eventType) {
      case 'net.authorize.payment.authcapture.created': {
        await handlePaymentCreated(notification.payload);
        break;
      }

      case 'net.authorize.payment.capture.created': {
        await handleCaptureCreated(notification.payload);
        break;
      }

      case 'net.authorize.payment.refund.created': {
        await handleRefundCreated(notification.payload);
        break;
      }

      case 'net.authorize.payment.void.created': {
        await handleVoidCreated(notification.payload);
        break;
      }

      case 'net.authorize.customer.subscription.created': {
        await handleARBSubscriptionCreated(notification.payload);
        break;
      }

      case 'net.authorize.customer.subscription.updated': {
        await handleARBSubscriptionUpdated(notification.payload);
        break;
      }

      case 'net.authorize.customer.subscription.cancelled': {
        await handleARBSubscriptionCancelled(notification.payload);
        break;
      }

      case 'net.authorize.customer.subscription.suspended': {
        await handleARBSubscriptionSuspended(notification.payload);
        break;
      }

      default:
        logger.info({ eventType }, 'Unhandled Authorize.net event type');
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Authorize.net webhook handler error');
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handlePaymentCreated(payload: any): Promise<void> {
  const transactionId = payload.id;
  const invoiceNumber = payload.invoiceNumber;

  if (!invoiceNumber) {
    logger.info({ transactionId }, 'Payment created without invoice number');
    return;
  }

  // Parse userId and planId from invoice number (format: userId:planId)
  const [userId, planId] = invoiceNumber.split(':');

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
      paymentGateway: 'authorize'
    },
    create: {
      userId,
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      paymentGateway: 'authorize'
    }
  });

  logger.info({ transactionId, userId, planType }, 'Authorize.net payment created - subscription activated');
}

async function handleCaptureCreated(payload: any): Promise<void> {
  const transactionId = payload.id;
  logger.info({ transactionId }, 'Authorize.net capture created');
}

async function handleRefundCreated(payload: any): Promise<void> {
  const transactionId = payload.id;
  logger.info({ transactionId }, 'Authorize.net refund created');
}

async function handleVoidCreated(payload: any): Promise<void> {
  const transactionId = payload.id;
  logger.info({ transactionId }, 'Authorize.net void created');
}

async function handleARBSubscriptionCreated(payload: any): Promise<void> {
  const subscriptionId = payload.id;
  const name = payload.name;

  if (!name) {
    return;
  }

  // Parse userId and planId from subscription name (format: userId:planId)
  const [userId, planId] = name.split(':');

  if (!userId) {
    return;
  }

  let planType: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER';
  if (planId) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (plan) {
      const planName = plan.name.toUpperCase();
      if (['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(planName)) {
        planType = planName as typeof planType;
      }
    }
  }

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      paymentGateway: 'authorize'
    },
    create: {
      userId,
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      paymentGateway: 'authorize'
    }
  });

  logger.info({ subscriptionId, userId }, 'Authorize.net ARB subscription created');
}

async function handleARBSubscriptionUpdated(payload: any): Promise<void> {
  const subscriptionId = payload.id;
  const status = payload.status;

  // Map Authorize.net status to our status
  let ourStatus: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' = 'ACTIVE';
  switch (status?.toLowerCase()) {
    case 'active':
      ourStatus = 'ACTIVE';
      break;
    case 'canceled':
    case 'terminated':
      ourStatus = 'CANCELLED';
      break;
    case 'suspended':
      ourStatus = 'PAST_DUE';
      break;
  }

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'authorize' },
    data: { status: ourStatus }
  });

  logger.info({ subscriptionId, status: ourStatus }, 'Authorize.net ARB subscription updated');
}

async function handleARBSubscriptionCancelled(payload: any): Promise<void> {
  const subscriptionId = payload.id;

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'authorize' },
    data: {
      status: 'CANCELLED',
      canceledAt: new Date()
    }
  });

  logger.info({ subscriptionId }, 'Authorize.net ARB subscription cancelled');
}

async function handleARBSubscriptionSuspended(payload: any): Promise<void> {
  const subscriptionId = payload.id;

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'authorize' },
    data: { status: 'PAST_DUE' }
  });

  logger.warn({ subscriptionId }, 'Authorize.net ARB subscription suspended');
}
