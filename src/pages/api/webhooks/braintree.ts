import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    const kind = notification.kind || notification.bt_signature?.split('|')[0];

    logger.info({ kind }, 'Braintree webhook received');

    // Get Braintree config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'braintree', isEnabled: true }
    });

    if (!gateway) {
      logger.warn({}, 'Braintree webhook received but gateway not configured');
      return res.status(200).json({ received: true });
    }

    // Handle different notification kinds
    switch (kind) {
      case 'subscription_charged_successfully': {
        await handleSubscriptionCharged(notification);
        break;
      }

      case 'subscription_charged_unsuccessfully': {
        await handleSubscriptionChargeFailed(notification);
        break;
      }

      case 'subscription_canceled': {
        await handleSubscriptionCanceled(notification);
        break;
      }

      case 'subscription_expired': {
        await handleSubscriptionExpired(notification);
        break;
      }

      case 'subscription_went_active': {
        await handleSubscriptionActive(notification);
        break;
      }

      case 'subscription_went_past_due': {
        await handleSubscriptionPastDue(notification);
        break;
      }

      default:
        logger.info({ kind }, 'Unhandled Braintree notification kind');
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Braintree webhook handler error');
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleSubscriptionCharged(notification: any): Promise<void> {
  const subscriptionId = notification.subscription?.id;
  const customerId = notification.subscription?.customerId;

  if (!customerId) {
    return;
  }

  // Find user by Braintree customer ID stored in additionalConfig
  const subscription = await prisma.subscription.findFirst({
    where: { paymentGateway: 'braintree' }
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' }
    });
  }

  logger.info({ subscriptionId, customerId }, 'Braintree subscription charged successfully');
}

async function handleSubscriptionChargeFailed(notification: any): Promise<void> {
  const subscriptionId = notification.subscription?.id;

  logger.warn({ subscriptionId }, 'Braintree subscription charge failed');
}

async function handleSubscriptionCanceled(notification: any): Promise<void> {
  const subscriptionId = notification.subscription?.id;

  // Update all Braintree subscriptions with this ID
  await prisma.subscription.updateMany({
    where: { paymentGateway: 'braintree' },
    data: {
      status: 'CANCELLED',
      canceledAt: new Date()
    }
  });

  logger.info({ subscriptionId }, 'Braintree subscription canceled');
}

async function handleSubscriptionExpired(notification: any): Promise<void> {
  const subscriptionId = notification.subscription?.id;

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'braintree' },
    data: { status: 'EXPIRED' }
  });

  logger.info({ subscriptionId }, 'Braintree subscription expired');
}

async function handleSubscriptionActive(notification: any): Promise<void> {
  const subscriptionId = notification.subscription?.id;

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'braintree' },
    data: { status: 'ACTIVE' }
  });

  logger.info({ subscriptionId }, 'Braintree subscription went active');
}

async function handleSubscriptionPastDue(notification: any): Promise<void> {
  const subscriptionId = notification.subscription?.id;

  await prisma.subscription.updateMany({
    where: { paymentGateway: 'braintree' },
    data: { status: 'PAST_DUE' }
  });

  logger.warn({ subscriptionId }, 'Braintree subscription went past due');
}
