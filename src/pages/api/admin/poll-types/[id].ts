import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user as any).role === 'USER') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const pollType = await prisma.pollType.findUnique({
        where: { id: String(id) },
        include: {
          _count: {
            select: { polls: true, templates: true }
          }
        }
      });

      if (!pollType) {
        return res.status(404).json({ error: 'Poll type not found' });
      }

      return res.json(pollType);
    } catch (error) {
      console.error('Failed to fetch poll type:', error);
      return res.status(500).json({ error: 'Failed to fetch poll type' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, description, icon, category, defaultConfig, isActive, sortOrder } = req.body;

      const pollType = await prisma.pollType.update({
        where: { id: String(id) },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(icon !== undefined && { icon }),
          ...(category !== undefined && { category }),
          ...(defaultConfig !== undefined && { defaultConfig }),
          ...(isActive !== undefined && { isActive }),
          ...(sortOrder !== undefined && { sortOrder })
        }
      });

      return res.json(pollType);
    } catch (error) {
      console.error('Failed to update poll type:', error);
      return res.status(500).json({ error: 'Failed to update poll type' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if it's a system type
      const pollType = await prisma.pollType.findUnique({
        where: { id: String(id) }
      });

      if (pollType?.isSystem) {
        return res.status(400).json({ error: 'Cannot delete system poll types' });
      }

      // Check if there are polls using this type
      const pollCount = await prisma.poll.count({
        where: { pollTypeId: String(id) }
      });

      if (pollCount > 0) {
        return res.status(400).json({ error: `Cannot delete: ${pollCount} polls are using this type` });
      }

      await prisma.pollType.delete({
        where: { id: String(id) }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete poll type:', error);
      return res.status(500).json({ error: 'Failed to delete poll type' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
