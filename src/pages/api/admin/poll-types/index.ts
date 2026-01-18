import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user as any).role === 'USER') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const pollTypes = await prisma.pollType.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { polls: true, templates: true }
          }
        }
      });
      return res.json(pollTypes);
    } catch (error) {
      console.error('Failed to fetch poll types:', error);
      return res.status(500).json({ error: 'Failed to fetch poll types' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { code, name, description, icon, category, defaultConfig } = req.body;

      const pollType = await prisma.pollType.create({
        data: {
          code,
          name,
          description,
          icon,
          category: category || 'choice',
          defaultConfig: defaultConfig || '{}',
          isSystem: false,
          isActive: true
        }
      });

      return res.json(pollType);
    } catch (error) {
      console.error('Failed to create poll type:', error);
      return res.status(500).json({ error: 'Failed to create poll type' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
