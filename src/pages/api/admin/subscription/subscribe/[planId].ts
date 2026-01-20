import { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId } = req.query;
    // For demo, return a mock checkout URL
    return res.json({ success: true, checkout_url: `https://checkout.stripe.com/pay/${planId}` });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Error subscribing:');
    return res.status(500).json({ success: false, error: 'Failed to start subscription' });
  }
}
