import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    const eventType = event.type;

    logger.info({ eventType, eventId: event.event_id }, 'Square webhook received');

    // Get Square config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'square', isEnabled: true }
    });

    if (!gateway) {
      logger.warn({}, 'Square webhook received but gateway not configured');
      return res.status(200).json({ received: true });
    }

    // Verify signature if webhook secret is configured
    if (gateway.webhookSecret) {
      const signature = req.headers['x-square-signature'] as string;
      const body = JSON.stringify(req.body);
      const notificationUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/square`;

      const expectedSignature = crypto
        .createHmac('sha1', gateway.webhookSecret)
        .update(notificationUrl + body)
        .digest('base64');

      if (signature !== expectedSignature) {
        logger.warn({}, 'Invalid Square webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Handle different event types
    switch (eventType) {
      case 'payment.completed': {
        await handlePaymentCompleted(event.data.object.payment);
        break;
      }

      case 'payment.updated': {
        await handlePaymentUpdated(event.data.object.payment);
        break;
      }

      case 'subscription.created': {
        await handleSubscriptionCreated(event.data.object.subscription);
        break;
      }

      case 'subscription.updated': {
        await handleSubscriptionUpdated(event.data.object.subscription);
        break;
      }

      case 'invoice.payment_made': {
        await handleInvoicePaymentMade(event.data.object.invoice);
        break;
      }

      default:
        logger.info({ eventType }, 'Unhandled Square event type');
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Square webhook handler error');
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handlePaymentCompleted(payment: any): Promise<void> {
  const paymentId = payment.id;
  const customerId = payment.customer_id;
  const referenceId = payment.reference_id;

  if (!referenceId) {
    logger.info({ paymentId }, 'Payment completed without reference ID');
    return;
  }

  // Parse userId and planId from reference (format: userId:planId)
  const [userId, planId] = referenceId.split(':');

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
      paymentGateway: 'square'
    },
    create: {
      userId,
      plan: planType,
      planId: planId || undefined,
      status: 'ACTIVE',
      paymentGateway: 'square'
    }
  });

  logger.info({ paymentId, userId, planType }, 'Square payment completed - subscription activated');
}

async function handlePaymentUpdated(payment: any): Promise<void> {
  const paymentId = payment.id;
  const status = payment.status;

  logger.info({ paymentId, status }, 'Square payment updated');
}

async function handleSubscriptionCreated(subscription: any): Promise<void> {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer_id;

  logger.info({ subscriptionId, customerId }, 'Square subscription created');
}

async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Map Square subscription status to our status
  let ourStatus: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' = 'ACTIVE';
  switch (status) {
    case 'ACTIVE':
      ourStatus = 'ACTIVE';
      break;
    case 'CANCELED':
      ourStatus = 'CANCELLED';
      break;
    case 'DEACTIVATED':
    case 'PAUSED':
      ourStatus = 'PAST_DUE';
      break;
  }

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'square' },
    data: { status: ourStatus }
  });

  logger.info({ subscriptionId, status: ourStatus }, 'Square subscription updated');
}

async function handleInvoicePaymentMade(invoice: any): Promise<void> {
  const invoiceId = invoice.id;
  const customerId = invoice.primary_recipient?.customer_id;

  logger.info({ invoiceId, customerId }, 'Square invoice payment made');
}
