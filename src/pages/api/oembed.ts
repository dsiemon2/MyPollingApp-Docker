import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma, getSetting } from '@/lib/prisma';

/**
 * oEmbed endpoint for WordPress native embedding
 * WordPress will call: /api/oembed?url=https://yourdomain.com/polls/123
 *
 * To enable in WordPress, add to theme's functions.php:
 * wp_oembed_add_provider('https://yourdomain.com/polls/*', 'https://yourdomain.com/api/oembed');
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, maxwidth = '500', maxheight = '450', format = 'json' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  // Extract poll ID from URL
  const urlStr = String(url);
  const pollIdMatch = urlStr.match(/\/polls\/([a-zA-Z0-9]+)/);

  if (!pollIdMatch) {
    return res.status(404).json({ error: 'Invalid poll URL' });
  }

  const pollId = pollIdMatch[1];

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
          include: { _count: { select: { votes: true } } }
        },
        _count: { select: { votes: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const totalVotes = poll._count.votes;

    // Get base URL from request
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:8610';
    const baseUrl = `${protocol}://${host}`;

    const width = Math.min(parseInt(String(maxwidth)) || 500, 800);
    const height = Math.min(parseInt(String(maxheight)) || 450, 600);
    const businessName = await getSetting('businessName');

    const oembedResponse = {
      version: '1.0',
      type: 'rich',
      provider_name: businessName,
      provider_url: baseUrl,
      title: poll.title,
      author_name: businessName,
      author_url: baseUrl,
      html: `<iframe src="${baseUrl}/embed/polls/${pollId}" width="${width}" height="${height}" frameborder="0" style="border-radius: 12px; border: 1px solid #e5e7eb; max-width: 100%;"></iframe>`,
      width: width,
      height: height,
      thumbnail_url: `${baseUrl}/api/polls/${pollId}/preview.png`,
      thumbnail_width: 400,
      thumbnail_height: 300,
      cache_age: 3600, // Cache for 1 hour
    };

    // Support XML format (rarely used but part of oEmbed spec)
    if (format === 'xml') {
      res.setHeader('Content-Type', 'application/xml');
      return res.send(`<?xml version="1.0" encoding="utf-8"?>
<oembed>
  <version>${oembedResponse.version}</version>
  <type>${oembedResponse.type}</type>
  <provider_name>${oembedResponse.provider_name}</provider_name>
  <provider_url>${oembedResponse.provider_url}</provider_url>
  <title><![CDATA[${oembedResponse.title}]]></title>
  <html><![CDATA[${oembedResponse.html}]]></html>
  <width>${oembedResponse.width}</width>
  <height>${oembedResponse.height}</height>
</oembed>`);
    }

    return res.status(200).json(oembedResponse);
  } catch (error) {
    console.error('oEmbed error:', error);
    return res.status(500).json({ error: 'Failed to generate oEmbed response' });
  }
}
