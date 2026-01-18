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
      const template = await prisma.pollTemplate.findUnique({
        where: { id: String(id) },
        include: {
          pollType: {
            select: { id: true, code: true, name: true, icon: true, category: true }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.json(template);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      return res.status(500).json({ error: 'Failed to fetch template' });
    }
  }

  if (req.method === 'PATCH') {
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
        defaultConfig,
        isActive,
        sortOrder
      } = req.body;

      const template = await prisma.pollTemplate.update({
        where: { id: String(id) },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(icon !== undefined && { icon }),
          ...(category !== undefined && { category }),
          ...(pollTypeId !== undefined && { pollTypeId }),
          ...(defaultTitle !== undefined && { defaultTitle }),
          ...(defaultDescription !== undefined && { defaultDescription }),
          ...(defaultOptions !== undefined && { defaultOptions }),
          ...(defaultConfig !== undefined && { defaultConfig }),
          ...(isActive !== undefined && { isActive }),
          ...(sortOrder !== undefined && { sortOrder })
        },
        include: {
          pollType: {
            select: { id: true, code: true, name: true, icon: true, category: true }
          }
        }
      });

      return res.json(template);
    } catch (error) {
      console.error('Failed to update template:', error);
      return res.status(500).json({ error: 'Failed to update template' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if it's a system template
      const template = await prisma.pollTemplate.findUnique({
        where: { id: String(id) }
      });

      if (template?.isSystem) {
        return res.status(400).json({ error: 'Cannot delete system templates' });
      }

      await prisma.pollTemplate.delete({
        where: { id: String(id) }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete template:', error);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
