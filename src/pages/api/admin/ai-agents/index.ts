import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - list all agents (no auth required for reading)
  if (req.method === 'GET') {
    try {
      const agents = await prisma.aIAgent.findMany({
        where: { enabled: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(agents);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to fetch agents:');
      return res.status(500).json({ error: 'Failed to fetch agents' });
    }
  }

  // POST - create new agent (admin only)
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes((session.user as any).role)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { name, displayName, description, systemPrompt, temperature } = req.body;

      if (!displayName) {
        return res.status(400).json({ error: 'Display name is required' });
      }

      // Generate a unique name if not provided
      const agentName = name || `agent_${Date.now()}`;

      const agent = await prisma.aIAgent.create({
        data: {
          name: agentName,
          displayName,
          description: description || null,
          systemPrompt: systemPrompt || null,
          temperature: temperature !== undefined ? temperature : 0.7,
          enabled: true
        }
      });

      return res.json(agent);
    } catch (error: any) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to create agent:');
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Agent name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create agent' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
