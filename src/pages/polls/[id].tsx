import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import VoiceRecorder from '@/components/VoiceRecorder';
import ShareModal from '@/components/ShareModal';
import { usePoll, usePollMessages, useVoteStatus, invalidatePoll, invalidateMessages } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import {
  SingleChoiceInput,
  MultipleChoiceInput,
  YesNoInput,
  RatingInput,
  NPSInput,
  RankedInput,
  OpenTextInput
} from '@/components/poll-inputs';
import {
  RatingResults,
  NPSResults,
  RankedResults,
  TextResults,
  YesNoResults
} from '@/components/poll-results';

interface PollOption {
  id: string;
  text: string;
  label?: string;
  votes: number;
  points?: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: PollOption[];
  totalVotes: number;
  totalVoters?: number;
  pollTypeCode?: string;
  type?: string;
  config?: {
    maxRating?: number;
    style?: 'stars' | 'numbers' | 'emoji';
    allowNeutral?: boolean;
    multiline?: boolean;
    maxLength?: number;
    placeholder?: string;
    maxRankings?: number;
    pointSystem?: number[];
    maxSelections?: number;
  };
  // Rating/NPS specific
  averageRating?: number;
  ratingCount?: number;
  npsScore?: number;
  detractorCount?: number;
  passiveCount?: number;
  promoterCount?: number;
  // Yes/No specific
  yesNoResults?: {
    yes: number;
    no: number;
    neutral: number;
  };
  // Open text specific
  textResponses?: { text: string; createdAt: string }[];
}

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
}

interface VoteStatus {
  hasVoted: boolean;
  votedOptionId: string | null;
  votedOptionIds: string[];
  votedValue: string | null;
  votedRating: number | null;
  votedRankings: Record<number, string>;
}

export default function PollPage() {
  const router = useRouter();
  const { id } = router.query;
  const pollId = typeof id === 'string' ? id : undefined;
  const { settings } = useSettings();

  // Get visitorId from localStorage
  const [visitorId, setVisitorId] = useState('');
  useEffect(() => {
    let vid = localStorage.getItem('pollchat_visitor_id');
    if (!vid) {
      vid = 'visitor_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pollchat_visitor_id', vid);
    }
    setVisitorId(vid);
  }, []);

  // SWR hooks for data fetching with auto-refresh
  const { poll, isLoading: pollLoading, refresh: refreshPoll } = usePoll(pollId);
  const { messages, refresh: refreshMessages } = usePollMessages(pollId);
  const { voteStatus, refresh: refreshVoteStatus } = useVoteStatus(pollId, visitorId);

  // UI state
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voting, setVoting] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // State for different poll types
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [yesNoValue, setYesNoValue] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [rankings, setRankings] = useState<Record<number, string>>({});
  const [textValue, setTextValue] = useState('');

  // Derive hasVoted from voteStatus (SWR managed)
  const hasVoted = voteStatus?.hasVoted || false;

  // Sync local state with vote status when it changes
  useEffect(() => {
    if (voteStatus?.hasVoted) {
      setSelectedOption(voteStatus.votedOptionId);
      setSelectedOptions(voteStatus.votedOptionIds || []);
      setYesNoValue(voteStatus.votedValue);
      setRating(voteStatus.votedRating);
      setRankings(voteStatus.votedRankings || {});
      if (voteStatus.votedValue && !['yes', 'no', 'neutral'].includes(voteStatus.votedValue)) {
        setTextValue(voteStatus.votedValue);
      }
    }
  }, [voteStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Legacy loading state for compatibility
  const loading = pollLoading;

  const getPollTypeCode = () => {
    return poll?.pollTypeCode || poll?.type || 'single_choice';
  };

  const canSubmitVote = () => {
    const pollType = getPollTypeCode();
    switch (pollType) {
      case 'single_choice':
      case 'single':
        return !!selectedOption;
      case 'multiple_choice':
      case 'multiple':
        return selectedOptions.length > 0;
      case 'yes_no':
        return !!yesNoValue;
      case 'rating_scale':
      case 'nps':
        return rating !== null;
      case 'ranked':
        return Object.keys(rankings).length > 0;
      case 'open_text':
        return textValue.trim().length > 0;
      default:
        return !!selectedOption;
    }
  };

  const handleVote = async () => {
    if (!canSubmitVote()) return;
    setVoting(true);

    const pollType = getPollTypeCode();
    let body: Record<string, unknown> = { visitorId };

    switch (pollType) {
      case 'single_choice':
      case 'single':
        body.optionId = selectedOption;
        break;
      case 'multiple_choice':
      case 'multiple':
        body.optionIds = selectedOptions;
        break;
      case 'yes_no':
        body.value = yesNoValue;
        break;
      case 'rating_scale':
      case 'nps':
        body.rating = rating;
        break;
      case 'ranked':
        body.rankings = rankings;
        break;
      case 'open_text':
        body.value = textValue;
        break;
      default:
        body.optionId = selectedOption;
    }

    try {
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        // Invalidate and refresh all poll data via SWR
        if (pollId) invalidatePoll(pollId);
        refreshPoll();
        refreshVoteStatus();
      } else {
        const data = await res.json();
        if (data.error === 'Already voted') {
          // Already voted - just refresh to get latest state
          refreshPoll();
          refreshVoteStatus();
        } else {
          alert(data.error || 'Failed to submit vote');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit vote');
    }
    setVoting(false);
  };

  const resetVote = async () => {
    try {
      await fetch(`/api/polls/${id}/vote`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      });
      // Clear local state
      setSelectedOption(null);
      setSelectedOptions([]);
      setYesNoValue(null);
      setRating(null);
      setRankings({});
      setTextValue('');
      // Refresh data via SWR
      if (pollId) invalidatePoll(pollId);
      refreshPoll();
      refreshVoteStatus();
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setSending(true);

    await fetch(`/api/polls/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, sender: 'user', visitorId })
    });

    setInput('');
    refreshMessages(); // SWR refresh

    try {
      const context = poll ? `Poll: "${poll.title}". Options: ${poll.options.map((o) => `${o.text || o.label} (${o.votes} votes)`).join(', ')}` : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context })
      });

      const data = await res.json();

      if (data.response) {
        await fetch(`/api/polls/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: data.response, sender: 'ai', visitorId })
        });
        refreshMessages(); // SWR refresh
      }
    } catch (error) {
      console.error(error);
    }

    setSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const renderVoteInput = () => {
    if (!poll) return null;
    const pollType = getPollTypeCode();
    const config = (poll.config || {}) as {
      maxRating?: number;
      style?: 'stars' | 'numbers' | 'emoji';
      allowNeutral?: boolean;
      multiline?: boolean;
      maxLength?: number;
      placeholder?: string;
      maxRankings?: number;
      pointSystem?: number[];
      maxSelections?: number;
    };

    switch (pollType) {
      case 'single_choice':
      case 'single':
        return (
          <SingleChoiceInput
            options={poll.options.map(o => ({ id: o.id, label: o.text || o.label || '' }))}
            selectedOption={selectedOption}
            onSelect={setSelectedOption}
            disabled={hasVoted}
            votedOptionId={voteStatus?.votedOptionId}
          />
        );

      case 'multiple_choice':
      case 'multiple':
        return (
          <MultipleChoiceInput
            options={poll.options.map(o => ({ id: o.id, label: o.text || o.label || '' }))}
            selectedOptions={selectedOptions}
            onSelect={setSelectedOptions}
            disabled={hasVoted}
            votedOptionIds={voteStatus?.votedOptionIds}
            maxSelections={config.maxSelections || null}
          />
        );

      case 'yes_no':
        return (
          <YesNoInput
            selectedValue={yesNoValue}
            onSelect={setYesNoValue}
            disabled={hasVoted}
            votedValue={voteStatus?.votedValue}
            config={{ allowNeutral: config.allowNeutral }}
          />
        );

      case 'rating_scale':
        return (
          <RatingInput
            selectedRating={rating}
            onSelect={setRating}
            disabled={hasVoted}
            votedRating={voteStatus?.votedRating}
            config={{
              maxValue: config.maxRating,
              style: config.style
            }}
          />
        );

      case 'nps':
        return (
          <NPSInput
            selectedScore={rating}
            onSelect={setRating}
            disabled={hasVoted}
            votedScore={voteStatus?.votedRating}
          />
        );

      case 'ranked':
        return (
          <RankedInput
            options={poll.options.map(o => ({ id: o.id, label: o.text || o.label || '' }))}
            rankings={rankings}
            onRankingChange={setRankings}
            disabled={hasVoted}
            votedRankings={voteStatus?.votedRankings}
            config={{
              maxRankings: config.maxRankings,
              pointSystem: config.pointSystem
            }}
          />
        );

      case 'open_text':
        return (
          <OpenTextInput
            value={textValue}
            onChange={setTextValue}
            disabled={hasVoted}
            votedValue={voteStatus?.votedValue}
            config={{
              multiline: config.multiline,
              maxLength: config.maxLength,
              placeholder: config.placeholder
            }}
          />
        );

      default:
        return (
          <SingleChoiceInput
            options={poll.options.map(o => ({ id: o.id, label: o.text || o.label || '' }))}
            selectedOption={selectedOption}
            onSelect={setSelectedOption}
            disabled={hasVoted}
            votedOptionId={voteStatus?.votedOptionId}
          />
        );
    }
  };

  const renderResults = () => {
    if (!poll || !hasVoted) return null;
    const pollType = getPollTypeCode();
    const config = (poll.config || {}) as {
      maxRating?: number;
      style?: 'stars' | 'numbers' | 'emoji';
      allowNeutral?: boolean;
      maxRankings?: number;
      pointSystem?: number[];
    };

    switch (pollType) {
      case 'single_choice':
      case 'single':
      case 'multiple_choice':
      case 'multiple':
        // Standard bar chart results (inline for these types)
        return (
          <div className="space-y-3 mt-4">
            {poll.options.map(option => {
              const optionVotes = option.votes ?? 0;
              const totalVotes = poll.totalVotes ?? 0;
              const percentage = totalVotes > 0
                ? Math.round((optionVotes / totalVotes) * 100)
                : 0;
              const isVotedOption = pollType.includes('multiple')
                ? selectedOptions.includes(option.id)
                : selectedOption === option.id;

              return (
                <div key={option.id} className="relative">
                  <div className={`p-3 rounded-lg border ${
                    isVotedOption ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        {option.text || option.label}
                        {isVotedOption && (
                          <span className="text-green-600 text-sm">(Your vote)</span>
                        )}
                      </span>
                      <span className="text-green-700 font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{optionVotes} votes</div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'yes_no':
        return (
          <div className="mt-4">
            <YesNoResults
              yesNoResults={poll.yesNoResults}
              totalVotes={poll.totalVotes}
              config={{ allowNeutral: config.allowNeutral }}
            />
          </div>
        );

      case 'rating_scale':
        return (
          <div className="mt-4">
            <RatingResults
              averageRating={poll.averageRating}
              ratingCount={poll.ratingCount}
              config={{
                maxRating: config.maxRating,
                style: config.style
              }}
            />
          </div>
        );

      case 'nps':
        return (
          <div className="mt-4">
            <NPSResults
              npsScore={poll.npsScore}
              detractorCount={poll.detractorCount}
              passiveCount={poll.passiveCount}
              promoterCount={poll.promoterCount}
              averageRating={poll.averageRating}
              ratingCount={poll.ratingCount}
            />
          </div>
        );

      case 'ranked':
        return (
          <div className="mt-4">
            <RankedResults
              options={poll.options.map(o => ({
                id: o.id,
                label: o.text || o.label || '',
                points: o.points || 0,
                votes: o.votes
              }))}
              totalVotes={poll.totalVotes}
              config={{ pointSystem: config.pointSystem }}
            />
          </div>
        );

      case 'open_text':
        return (
          <div className="mt-4">
            <TextResults
              textResponses={poll.textResponses}
              totalVotes={poll.totalVotes}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getVoteSummary = () => {
    if (!poll || !hasVoted) return null;
    const pollType = getPollTypeCode();

    switch (pollType) {
      case 'single_choice':
      case 'single':
        const votedOption = poll.options.find(o => o.id === selectedOption);
        return votedOption ? `You voted for: ${votedOption.text || votedOption.label}` : null;

      case 'multiple_choice':
      case 'multiple':
        const votedOptions = poll.options.filter(o => selectedOptions.includes(o.id));
        return votedOptions.length > 0
          ? `You selected: ${votedOptions.map(o => o.text || o.label).join(', ')}`
          : null;

      case 'yes_no':
        return yesNoValue ? `You voted: ${yesNoValue.charAt(0).toUpperCase() + yesNoValue.slice(1)}` : null;

      case 'rating_scale':
        return rating !== null ? `You rated: ${rating} / ${poll.config?.maxRating || 5}` : null;

      case 'nps':
        return rating !== null ? `You rated: ${rating} / 10` : null;

      case 'ranked':
        const rankedCount = Object.keys(rankings).length;
        return rankedCount > 0 ? `You ranked ${rankedCount} options` : null;

      case 'open_text':
        return 'Your response has been submitted';

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Poll Not Found</h1>
          <Link href="/polls" className="text-green-700 hover:underline">Back to Polls</Link>
        </div>
      </div>
    );
  }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pollUrl = `${siteUrl}/polls/${id}`;
  const shareDescription = poll.description || `Vote now! ${poll.totalVotes} votes so far.`;

  return (
    <>
      <Head>
        <title>{poll.title} - {settings.businessName}</title>
        <meta name="description" content={shareDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pollUrl} />
        <meta property="og:title" content={`Poll: ${poll.title}`} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:site_name" content={settings.businessName} />
        <meta property="og:image" content={`${siteUrl}/api/polls/${id}/preview.png`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pollUrl} />
        <meta name="twitter:title" content={`Poll: ${poll.title}`} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={`${siteUrl}/api/polls/${id}/preview.png`} />

        {/* oEmbed Discovery for WordPress */}
        <link
          rel="alternate"
          type="application/json+oembed"
          href={`${siteUrl}/api/oembed?url=${encodeURIComponent(pollUrl)}`}
          title={poll.title}
        />
      </Head>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        pollId={id as string}
        pollTitle={poll.title}
        pollDescription={poll.description || undefined}
      />

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={settings.logoUrl || '/images/PoligoPro.png'}
                alt={`${settings.businessName} Logo`}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <Link href="/polls" className="text-gray-600 hover:text-green-700">
              ← All Polls
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Poll Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{poll.title}</h1>
                  {poll.description && (
                    <p className="text-gray-600">{poll.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors ml-4"
                  title="Share this poll"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="font-medium">Share</span>
                </button>
              </div>

              {/* Vote Input or Results */}
              <div className="mb-6">
                {!hasVoted ? (
                  renderVoteInput()
                ) : (
                  renderResults()
                )}
              </div>

              {/* Vote Status */}
              {hasVoted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                    <span>✓</span>
                    {getVoteSummary()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {!hasVoted ? (
                  <button
                    onClick={handleVote}
                    disabled={!canSubmitVote() || voting}
                    className="flex-1 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {voting ? 'Submitting...' : 'Submit Vote'}
                  </button>
                ) : (
                  <button
                    onClick={resetVote}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    Reset Vote (Test Again)
                  </button>
                )}
              </div>

              <p className="text-center text-gray-500 text-sm mt-4">
                {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''} total
                {poll.totalVoters && poll.totalVoters !== poll.totalVotes && (
                  <span className="text-gray-400"> ({poll.totalVoters} voters)</span>
                )}
              </p>
            </div>

            {/* Chat Section */}
            <div className="bg-white rounded-xl shadow-sm flex flex-col h-[600px]">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-800">Discussion</h2>
                <p className="text-sm text-gray-500">Chat about this poll with AI assistant</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p>No messages yet.</p>
                    <p className="text-sm mt-1">Start a conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEnd} />
              </div>

              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <VoiceRecorder onTranscription={(text) => sendMessage(text)} />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
