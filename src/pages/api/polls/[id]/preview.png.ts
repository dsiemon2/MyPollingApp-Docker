import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma, getSetting } from '@/lib/prisma';

/**
 * Generate preview image for social media sharing
 * GET /api/polls/[id]/preview.png
 *
 * Returns an SVG image that displays well on social media
 * (SVG is widely supported and scales perfectly)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: String(id) },
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
    const businessName = await getSetting('businessName');

    // Escape HTML entities
    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;');

    // Truncate text
    const truncate = (str: string, len: number) =>
      str.length > len ? str.slice(0, len - 3) + '...' : str;

    // Calculate dimensions
    const width = 1200;
    const height = 630; // Standard OG image size
    const padding = 60;
    const optionHeight = 50;
    const maxOptions = 4;

    // Generate option bars
    const options = poll.options.slice(0, maxOptions);
    const optionsSvg = options.map((option, index) => {
      const votes = option._count.votes;
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      const barWidth = ((width - padding * 2 - 100) * percentage) / 100;
      const y = 280 + index * (optionHeight + 20);

      return `
        <!-- Option ${index + 1} -->
        <rect x="${padding}" y="${y}" width="${width - padding * 2}" height="${optionHeight}" rx="8" fill="#f3f4f6"/>
        <rect x="${padding}" y="${y}" width="${Math.max(barWidth, 0)}" height="${optionHeight}" rx="8" fill="#7c3aed" opacity="0.8"/>
        <text x="${padding + 16}" y="${y + 32}" font-family="Arial, sans-serif" font-size="20" fill="#1f2937" font-weight="500">${escapeHtml(truncate(option.label, 40))}</text>
        <text x="${width - padding - 16}" y="${y + 32}" font-family="Arial, sans-serif" font-size="20" fill="#7c3aed" font-weight="700" text-anchor="end">${percentage}%</text>
      `;
    }).join('');

    // Show "+X more" if there are more options
    const moreOptions = poll.options.length > maxOptions
      ? `<text x="${width / 2}" y="${280 + maxOptions * (optionHeight + 20) + 30}" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">+ ${poll.options.length - maxOptions} more options</text>`
      : '';

    // Generate SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f5f3ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ede9fe;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Card background -->
  <rect x="${padding - 20}" y="${padding - 20}" width="${width - padding * 2 + 40}" height="${height - padding * 2 + 40}" rx="24" fill="white" filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"/>

  <!-- Logo/Brand -->
  <text x="${padding}" y="${padding + 30}" font-family="Arial, sans-serif" font-size="24" fill="#7c3aed" font-weight="700">${businessName}</text>

  <!-- Poll indicator -->
  <rect x="${padding + 140}" y="${padding + 12}" width="60" height="28" rx="14" fill="#f3e8ff"/>
  <text x="${padding + 170}" y="${padding + 31}" font-family="Arial, sans-serif" font-size="14" fill="#7c3aed" text-anchor="middle" font-weight="600">POLL</text>

  <!-- Title -->
  <text x="${padding}" y="${padding + 100}" font-family="Arial, sans-serif" font-size="36" fill="#1f2937" font-weight="700">${escapeHtml(truncate(poll.title, 50))}</text>

  <!-- Description -->
  ${poll.description ? `<text x="${padding}" y="${padding + 140}" font-family="Arial, sans-serif" font-size="18" fill="#6b7280">${escapeHtml(truncate(poll.description, 80))}</text>` : ''}

  <!-- Vote count badge -->
  <text x="${width - padding}" y="${padding + 100}" font-family="Arial, sans-serif" font-size="18" fill="#6b7280" text-anchor="end">${totalVotes.toLocaleString()} votes</text>

  <!-- Options -->
  ${optionsSvg}

  ${moreOptions}

  <!-- Footer -->
  <text x="${width / 2}" y="${height - padding + 10}" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">Vote now at ${businessName}</text>
</svg>`;

    // Return SVG as image
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
    return res.send(svg);
  } catch (error) {
    console.error('Preview image generation error:', error);
    return res.status(500).json({ error: 'Failed to generate preview image' });
  }
}
