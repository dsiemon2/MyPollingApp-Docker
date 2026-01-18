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
      const templates = await prisma.pollTemplate.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          pollType: {
            select: { id: true, code: true, name: true, icon: true, category: true }
          }
        }
      });
      return res.json(templates);
    } catch (error) {
      console.error('Failed to fetch poll templates:', error);
      return res.status(500).json({ error: 'Failed to fetch poll templates' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        icon,
        category,
        pollTypeId,
        defaultTitle,
        defaultDescription,
        defaultOptions,
        defaultConfig
      } = req.body;

      const template = await prisma.pollTemplate.create({
        data: {
          name,
          description,
          icon,
          category,
          pollTypeId,
          defaultTitle,
          defaultDescription,
          defaultOptions: defaultOptions || '[]',
          defaultConfig: defaultConfig || '{}',
          isSystem: false,
          isActive: true
        },
        include: {
          pollType: {
            select: { id: true, code: true, name: true, icon: true, category: true }
          }
        }
      });

      return res.json(template);
    } catch (error) {
      console.error('Failed to create poll template:', error);
      return res.status(500).json({ error: 'Failed to create poll template' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
