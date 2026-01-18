import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await prisma.knowledgeDocument.delete({ where: { id: String(id) } });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const doc = await prisma.knowledgeDocument.update({
        where: { id: String(id) },
        data: req.body
      });
      return res.json(doc);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update document' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
