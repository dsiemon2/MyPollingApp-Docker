import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const gateways = await prisma.paymentGateway.findMany({
        orderBy: { provider: 'asc' }
      });
      return res.json({ gateways });
    } catch (error) {
      console.error('Failed to fetch payment gateways:', error);
      return res.status(500).json({ error: 'Failed to fetch payment gateways' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { gateways } = req.body;

      if (!Array.isArray(gateways)) {
        return res.status(400).json({ error: 'Invalid gateways data' });
      }

      for (const gateway of gateways) {
        const updateData: Record<string, unknown> = {
          isEnabled: gateway.isEnabled,
          publishableKey: gateway.publishableKey || null,
          testMode: gateway.testMode,
          achEnabled: gateway.achEnabled || false,
          webhookSecret: gateway.webhookSecret || null,
          merchantId: gateway.merchantId || null,
        };

        // Only update secretKey if a new value was provided
        if (gateway.secretKey && gateway.secretKey.trim() !== '') {
          updateData.secretKey = gateway.secretKey;
        }

        await prisma.paymentGateway.upsert({
          where: { provider: gateway.provider },
          update: updateData,
          create: {
            provider: gateway.provider,
            isEnabled: gateway.isEnabled,
            publishableKey: gateway.publishableKey || null,
            secretKey: gateway.secretKey || null,
            testMode: gateway.testMode,
            achEnabled: gateway.achEnabled || false,
            webhookSecret: gateway.webhookSecret || null,
            merchantId: gateway.merchantId || null,
          },
        });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to save payment gateways:', error);
      return res.status(500).json({ error: 'Failed to save payment gateways' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
