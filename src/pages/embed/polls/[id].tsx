import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSettings } from '@/hooks/useSettings';

interface PollOption {
  id: string;
  text?: string;
  label?: string;
  votes?: number;
  _count?: { votes: number };
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: PollOption[];
  totalVotes: number;
  _count?: { votes: number };
}

export default function EmbedPollPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { id, theme = 'light', showResults = 'true', allowVote = 'true' } = router.query;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState('');

  const isDark = theme === 'dark';
  const canVote = allowVote !== 'false';
  const showResultsFlag = showResults !== 'false';

  useEffect(() => {
    // Generate or retrieve visitor ID
    let vid = localStorage.getItem('mypollingapp_embed_visitor_id');
    if (!vid) {
      vid = 'embed_visitor_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('mypollingapp_embed_visitor_id', vid);
    }
    setVisitorId(vid);
  }, []);

  useEffect(() => {
    if (id && visitorId) {
      fetchPoll();
    }
  }, [id, visitorId]);

  const fetchPoll = async () => {
    try {
      const res = await fetch(`/api/polls/${id}`);
      const data = await res.json();
      setPoll(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !canVote) return;

    try {
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOption, visitorId })
      });

      if (res.ok) {
        setHasVoted(true);
        await fetchPoll();
      } else {
        const data = await res.json();
        if (data.error === 'Already voted') {
          setHasVoted(true);
          await fetchPoll();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:border-purple-500' : 'hover:border-purple-300';
  const selectedBg = isDark ? 'bg-purple-900/50 border-purple-500' : 'bg-purple-50 border-purple-600';
  const votedBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const barBg = isDark ? 'bg-gray-700' : 'bg-gray-200';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <p className={textMuted}>Poll not found</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{poll.title} - {settings.businessName}</title>
        <style>{`
          body { margin: 0; padding: 0; }
          * { box-sizing: border-box; }
        `}</style>
      </Head>
      <div className={`min-h-screen ${bgColor} p-4`}>
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className={`text-lg font-bold ${textColor}`}>{poll.title}</h1>
            {poll.description && (
              <p className={`text-sm ${textMuted} mt-1`}>{poll.description}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-4">
            {poll.options.map(option => {
              // Get votes from either votes field or _count.votes
              const optionVotes = option.votes ?? option._count?.votes ?? 0;
              const totalVotes = poll.totalVotes ?? poll._count?.votes ?? 0;
              const percentage = totalVotes > 0
                ? Math.round((optionVotes / totalVotes) * 100)
                : 0;
              // Get text from either text or label field
              const optionText = option.text || option.label || '';

              const showPercentage = hasVoted && showResultsFlag;

              return (
                <button
                  key={option.id}
                  onClick={() => !hasVoted && canVote && setSelectedOption(option.id)}
                  disabled={hasVoted || !canVote}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedOption === option.id
                      ? selectedBg
                      : hasVoted
                      ? votedBg
                      : `${borderColor} ${hoverBg}`
                  } ${!canVote && !hasVoted ? 'cursor-default' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium text-sm ${textColor}`}>{optionText}</span>
                    {showPercentage && (
                      <span className="text-purple-600 font-semibold text-sm">{percentage}%</span>
                    )}
                  </div>
                  {showPercentage && (
                    <div className={`w-full ${barBg} rounded-full h-1.5`}>
                      <div
                        className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Vote Button */}
          {canVote && !hasVoted && (
            <button
              onClick={handleVote}
              disabled={!selectedOption}
              className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Vote
            </button>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <p className={`text-xs ${textMuted}`}>
              {poll.totalVotes ?? poll._count?.votes ?? 0} vote{(poll.totalVotes ?? poll._count?.votes ?? 0) !== 1 ? 's' : ''}
            </p>
            <a
              href={`/polls/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-600 hover:underline flex items-center gap-1"
            >
              View on {settings.businessName}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
