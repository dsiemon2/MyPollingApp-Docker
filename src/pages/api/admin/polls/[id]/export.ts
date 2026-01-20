import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || !['SUPER_ADMIN', 'POLL_ADMIN'].includes((session.user as any).role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, format = 'csv' } = req.query;

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: String(id) },
      include: {
        options: { orderBy: { orderIndex: 'asc' } },
        votes: {
          include: {
            user: { select: { email: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        pollType: true,
        creator: { select: { email: true, name: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (format === 'json') {
      return res.json({
        poll: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          type: poll.pollType?.name || poll.type,
          status: poll.status,
          createdAt: poll.createdAt,
          createdBy: poll.creator?.name || poll.creator?.email || 'Unknown'
        },
        options: poll.options.map(o => ({ id: o.id, label: o.label })),
        votes: poll.votes.map(v => ({
          id: v.id,
          value: v.value ? JSON.parse(v.value) : null,
          votedAt: v.createdAt,
          voter: v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous')
        })),
        summary: generateSummary(poll)
      });
    }

    // Generate CSV
    const csv = generateCSV(poll);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="poll-${poll.id}-export.csv"`);
    return res.send(csv);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Export error:');
    return res.status(500).json({ error: 'Failed to export poll data' });
  }
}

function generateSummary(poll: any) {
  const votes = poll.votes;
  const summary: Record<string, any> = {
    totalVotes: votes.length
  };

  const pollTypeCode = poll.pollType?.code || poll.type;

  if (['single_choice', 'multiple_choice', 'yes_no', 'single', 'multiple'].includes(pollTypeCode)) {
    const optionCounts: Record<string, number> = {};
    poll.options.forEach((o: any) => { optionCounts[o.id] = 0; });

    votes.forEach((v: any) => {
      try {
        const value = JSON.parse(v.value);
        if (value.selectedOption) {
          optionCounts[value.selectedOption] = (optionCounts[value.selectedOption] || 0) + 1;
        }
        if (value.selectedOptions) {
          value.selectedOptions.forEach((optId: string) => {
            optionCounts[optId] = (optionCounts[optId] || 0) + 1;
          });
        }
      } catch {}
    });

    summary.optionResults = poll.options.map((o: any) => ({
      label: o.label,
      votes: optionCounts[o.id] || 0,
      percentage: votes.length > 0 ? Math.round((optionCounts[o.id] / votes.length) * 100) : 0
    }));
  }

  if (['rating_scale', 'rating'].includes(pollTypeCode)) {
    const ratings = votes.map((v: any) => {
      try {
        return JSON.parse(v.value).rating || 0;
      } catch { return 0; }
    }).filter((r: number) => r > 0);

    if (ratings.length > 0) {
      summary.averageRating = Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 100) / 100;
      summary.ratingDistribution = [1, 2, 3, 4, 5].map(r => ({
        rating: r,
        count: ratings.filter((x: number) => x === r).length
      }));
    }
  }

  if (['nps'].includes(pollTypeCode)) {
    const scores = votes.map((v: any) => {
      try {
        return JSON.parse(v.value).score;
      } catch { return null; }
    }).filter((s: any) => s !== null);

    if (scores.length > 0) {
      const promoters = scores.filter((s: number) => s >= 9).length;
      const detractors = scores.filter((s: number) => s <= 6).length;
      summary.npsScore = Math.round(((promoters - detractors) / scores.length) * 100);
      summary.promoters = promoters;
      summary.passives = scores.filter((s: number) => s >= 7 && s <= 8).length;
      summary.detractors = detractors;
    }
  }

  return summary;
}

function generateCSV(poll: any): string {
  const lines: string[] = [];
  const pollTypeCode = poll.pollType?.code || poll.type;

  // Header info
  lines.push(`"Poll Export Report"`);
  lines.push(`"Title","${escapeCSV(poll.title)}"`);
  lines.push(`"Description","${escapeCSV(poll.description || '')}"`);
  lines.push(`"Type","${escapeCSV(poll.pollType?.name || poll.type)}"`);
  lines.push(`"Status","${poll.status}"`);
  lines.push(`"Created","${poll.createdAt.toISOString()}"`);
  lines.push(`"Created By","${escapeCSV(poll.creator?.name || poll.creator?.email || 'Unknown')}"`);
  lines.push(`"Total Votes","${poll.votes.length}"`);
  lines.push('');

  // Summary section
  const summary = generateSummary(poll);

  if (summary.optionResults) {
    lines.push('"Results Summary"');
    lines.push('"Option","Votes","Percentage"');
    summary.optionResults.forEach((r: any) => {
      lines.push(`"${escapeCSV(r.label)}","${r.votes}","${r.percentage}%"`);
    });
    lines.push('');
  }

  if (summary.averageRating !== undefined) {
    lines.push('"Rating Summary"');
    lines.push(`"Average Rating","${summary.averageRating}"`);
    lines.push('"Rating","Count"');
    summary.ratingDistribution?.forEach((r: any) => {
      lines.push(`"${r.rating} stars","${r.count}"`);
    });
    lines.push('');
  }

  if (summary.npsScore !== undefined) {
    lines.push('"NPS Summary"');
    lines.push(`"NPS Score","${summary.npsScore}"`);
    lines.push(`"Promoters (9-10)","${summary.promoters}"`);
    lines.push(`"Passives (7-8)","${summary.passives}"`);
    lines.push(`"Detractors (0-6)","${summary.detractors}"`);
    lines.push('');
  }

  // Individual votes
  lines.push('"Individual Responses"');

  if (['single_choice', 'multiple_choice', 'yes_no', 'single', 'multiple'].includes(pollTypeCode)) {
    lines.push('"Timestamp","Voter","Selection"');
    poll.votes.forEach((v: any) => {
      const voter = v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous');
      try {
        const value = JSON.parse(v.value);
        let selection = '';
        if (value.selectedOption) {
          const opt = poll.options.find((o: any) => o.id === value.selectedOption);
          selection = opt?.label || value.selectedOption;
        } else if (value.selectedOptions) {
          selection = value.selectedOptions.map((optId: string) => {
            const opt = poll.options.find((o: any) => o.id === optId);
            return opt?.label || optId;
          }).join('; ');
        }
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(selection)}"`);
      } catch {
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(v.value)}"`);
      }
    });
  } else if (['rating_scale', 'rating'].includes(pollTypeCode)) {
    lines.push('"Timestamp","Voter","Rating"');
    poll.votes.forEach((v: any) => {
      const voter = v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous');
      try {
        const value = JSON.parse(v.value);
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${value.rating}"`);
      } catch {
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${v.value}"`);
      }
    });
  } else if (['nps'].includes(pollTypeCode)) {
    lines.push('"Timestamp","Voter","Score","Category"');
    poll.votes.forEach((v: any) => {
      const voter = v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous');
      try {
        const value = JSON.parse(v.value);
        const score = value.score;
        const category = score >= 9 ? 'Promoter' : score >= 7 ? 'Passive' : 'Detractor';
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${score}","${category}"`);
      } catch {
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${v.value}",""`);
      }
    });
  } else if (['ranked'].includes(pollTypeCode)) {
    lines.push('"Timestamp","Voter","Rankings"');
    poll.votes.forEach((v: any) => {
      const voter = v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous');
      try {
        const value = JSON.parse(v.value);
        const rankings = (value.rankings || []).map((optId: string, i: number) => {
          const opt = poll.options.find((o: any) => o.id === optId);
          return `${i + 1}. ${opt?.label || optId}`;
        }).join('; ');
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(rankings)}"`);
      } catch {
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(v.value)}"`);
      }
    });
  } else if (['open_text'].includes(pollTypeCode)) {
    lines.push('"Timestamp","Voter","Response"');
    poll.votes.forEach((v: any) => {
      const voter = v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous');
      try {
        const value = JSON.parse(v.value);
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(value.text || '')}"`);
      } catch {
        lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(v.value)}"`);
      }
    });
  } else {
    lines.push('"Timestamp","Voter","Value"');
    poll.votes.forEach((v: any) => {
      const voter = v.user ? (v.user.name || v.user.email) : (v.voterFingerprint || 'Anonymous');
      lines.push(`"${v.createdAt.toISOString()}","${escapeCSV(voter)}","${escapeCSV(v.value)}"`);
    });
  }

  return lines.join('\n');
}

function escapeCSV(str: string): string {
  if (!str) return '';
  return str.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
}
