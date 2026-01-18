import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const documents = await prisma.knowledgeDocument.findMany({
        include: { language: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(documents);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, content, type, languageId } = req.body;
      const doc = await prisma.knowledgeDocument.create({
        data: { title, content, type: type || 'text', languageId, enabled: true }
      });
      return res.json(doc);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create document' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
