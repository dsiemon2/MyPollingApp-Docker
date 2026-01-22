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
    // Get authenticated user
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (plan.price === 0) {
      return res.status(400).json({ error: 'Cannot create checkout for free plan' });
    }

    // Get enabled payment gateway
    const gateway = await prisma.paymentGateway.findFirst({
      where: { isEnabled: true }
    });

    if (!gateway) {
      return res.status(400).json({ error: 'No payment gateway is configured' });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:8610';

    // Handle different payment gateways
    switch (gateway.provider) {
      case 'stripe': {
        if (!gateway.secretKey) {
          return res.status(500).json({ error: 'Stripe is not properly configured' });
        }

        const stripe = new Stripe(gateway.secretKey, {
          apiVersion: '2023-10-16' as Stripe.LatestApiVersion
        });

        // Get or create Stripe customer
        let customerId = user.subscription?.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: { userId: user.id }
          });
          customerId = customer.id;

          // Save customer ID
          if (user.subscription) {
            await prisma.subscription.update({
              where: { userId: user.id },
              data: { stripeCustomerId: customerId }
            });
          }
        }

        // Create checkout session
        const priceId = plan.stripePriceId;

        // If no Stripe price ID, create a price on the fly
        let sessionParams: Stripe.Checkout.SessionCreateParams;

        if (priceId) {
          sessionParams = {
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout/cancel?plan_id=${planId}`,
            metadata: {
              userId: user.id,
              planId: plan.id,
              planName: plan.name
            }
          };
        } else {
          // Create price inline for plans without Stripe price ID
          sessionParams = {
            customer: customerId,
            mode: 'subscription',
            line_items: [{
              price_data: {
                currency: 'usd',
                product_data: {
                  name: plan.displayName,
                  description: plan.description || undefined
                },
                unit_amount: Math.round(plan.price * 100), // Convert to cents
                recurring: {
                  interval: plan.interval === 'year' ? 'year' : 'month'
                }
              },
              quantity: 1
            }],
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout/cancel?plan_id=${planId}`,
            metadata: {
              userId: user.id,
              planId: plan.id,
              planName: plan.name
            }
          };
        }

        const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

        logger.info({ sessionId: checkoutSession.id, planId }, 'Stripe checkout session created');

        return res.json({
          success: true,
          sessionId: checkoutSession.id,
          url: checkoutSession.url
        });
      }

      case 'paypal': {
        // For PayPal, redirect to a PayPal-specific checkout flow
        return res.json({
          success: true,
          url: `${baseUrl}/checkout/${planId}?gateway=paypal`
        });
      }

      default: {
        return res.status(400).json({
          error: `Payment gateway '${gateway.provider}' is not supported for checkout`
        });
      }
    }
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Checkout session creation failed');
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
