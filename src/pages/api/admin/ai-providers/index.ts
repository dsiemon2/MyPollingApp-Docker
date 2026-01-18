import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const providers = await prisma.aIProvider.findMany({
        orderBy: { name: 'asc' }
      });
      return res.json(providers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch providers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, displayName, apiKey, baseUrl, model, isDefault } = req.body;

      // If setting as default, unset other defaults first
      if (isDefault) {
        await prisma.aIProvider.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const provider = await prisma.aIProvider.create({
        data: { name, displayName, apiKey, baseUrl, model, isDefault, enabled: true }
      });
      return res.json(provider);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create provider' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
