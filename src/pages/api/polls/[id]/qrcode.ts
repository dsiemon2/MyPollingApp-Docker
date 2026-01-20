import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

/**
 * Generate QR code for a poll
 * GET /api/polls/[id]/qrcode?size=300&format=png
 *
 * Query params:
 * - size: QR code size in pixels (default: 300, max: 1000)
 * - format: 'png' (default) or 'svg'
 * - dark: Dark color hex (default: #000000)
 * - light: Light color hex (default: #ffffff)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const {
    size = '300',
    format = 'png',
    dark = '#000000',
    light = '#ffffff'
  } = req.query;

  try {
    // Verify poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: String(id) }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get base URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:8610';
    const baseUrl = `${protocol}://${host}`;
    const pollUrl = `${baseUrl}/polls/${id}`;

    // Constrain size
    const qrSize = Math.min(Math.max(parseInt(String(size)) || 300, 100), 1000);

    if (format === 'svg') {
      // Generate SVG
      const svg = await QRCode.toString(pollUrl, {
        type: 'svg',
        width: qrSize,
        color: {
          dark: String(dark),
          light: String(light)
        },
        margin: 2
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
      return res.send(svg);
    } else {
      // Generate PNG as data URL then convert to buffer
      const dataUrl = await QRCode.toDataURL(pollUrl, {
        width: qrSize,
        color: {
          dark: String(dark),
          light: String(light)
        },
        margin: 2
      });

      // Convert data URL to buffer
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
      res.setHeader('Content-Disposition', `inline; filename="poll-${id}-qr.png"`);
      return res.send(buffer);
    }
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'QR code generation error:');
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
