import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { onChatMessage } from '@/services/webhooks';
import { onChatMessageRule } from '@/services/logicRules';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { pollId: String(id) },
        orderBy: { createdAt: 'asc' }
      });
      // Map to expected format
      const formattedMessages = messages.map(m => ({
        ...m,
        sender: m.role
      }));
      return res.json(formattedMessages);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content, sender, visitorId } = req.body;

      const message = await prisma.chatMessage.create({
        data: {
          pollId: String(id),
          content,
          role: sender,
          username: visitorId || 'Anonymous'
        }
      });

      // Emit webhook event for chat message
      onChatMessage({
        pollId: String(id),
        content,
        role: sender
      }).catch(err => console.error('Webhook error:', err));

      // Evaluate logic rules for chat message
      onChatMessageRule(
        { id: String(id), title: '' }, // Title not needed for most rules
        { content, role: sender }
      ).catch(err => console.error('Logic rule error:', err));

      return res.json({ ...message, sender: message.role });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
