import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // GET - fetch single agent
  if (req.method === 'GET') {
    try {
      const agent = await prisma.aIAgent.findUnique({
        where: { id: String(id) }
      });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      return res.json(agent);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch agent' });
    }
  }

  // Admin-only operations below
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes((session.user as any).role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.aIAgent.delete({ where: { id: String(id) } });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete agent' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const agent = await prisma.aIAgent.update({
        where: { id: String(id) },
        data: req.body
      });
      return res.json(agent);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update agent' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
