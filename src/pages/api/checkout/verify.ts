import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get Stripe gateway config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'stripe', isEnabled: true }
    });

    if (!gateway?.secretKey) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }

    const stripe = new Stripe(gateway.secretKey, {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion
    });

    // Retrieve checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (checkoutSession.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Verify the session belongs to this user
    const metadata = checkoutSession.metadata;
    if (metadata?.userId !== user.id) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    const subscription = checkoutSession.subscription as Stripe.Subscription | null;
    const planId = metadata?.planId;

    // Get the plan to determine PlanType
    let planType: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'STARTER';
    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });
      if (plan) {
        const planName = plan.name.toUpperCase();
        if (['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(planName)) {
          planType = planName as typeof planType;
        }
      }
    }

    // Update subscription in database
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: planType,
        planId: planId || undefined,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription?.id,
        stripeCustomerId: checkoutSession.customer as string,
        paymentGateway: 'stripe',
        currentPeriodStart: subscription?.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : new Date(),
        currentPeriodEnd: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined
      },
      create: {
        userId: user.id,
        plan: planType,
        planId: planId || undefined,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription?.id,
        stripeCustomerId: checkoutSession.customer as string,
        paymentGateway: 'stripe',
        currentPeriodStart: subscription?.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : new Date(),
        currentPeriodEnd: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined
      }
    });

    logger.info({ userId: user.id, planType, subscriptionId: subscription?.id }, 'Subscription verified and activated');

    return res.json({
      success: true,
      plan: planType
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Checkout verification failed');
    return res.status(500).json({
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
