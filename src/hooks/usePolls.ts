import useSWR, { mutate } from 'swr';

// Poll types for type safety (exported for use in components)
export interface PollOption {
  id: string;
  text?: string;
  label?: string;
  votes: number;
  points?: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: PollOption[];
  totalVotes: number;
  totalVoters?: number;
  pollTypeCode?: string;
  type?: string;
  config?: Record<string, unknown>;
  averageRating?: number;
  ratingCount?: number;
  npsScore?: number;
  detractorCount?: number;
  passiveCount?: number;
  promoterCount?: number;
  yesNoResults?: { yes: number; no: number; neutral: number };
  textResponses?: { text: string; createdAt: string }[];
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
}

export interface VoteStatus {
  hasVoted: boolean;
  votedOptionId: string | null;
  votedOptionIds: string[];
  votedValue: string | null;
  votedRating: number | null;
  votedRankings: Record<number, string>;
}

// Generic fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

// SWR configuration for polls
const pollConfig = {
  revalidateOnFocus: true,      // Refresh when user returns to tab
  revalidateOnReconnect: true,  // Refresh when network reconnects
  refreshInterval: 10000,       // Auto-refresh every 10 seconds
  dedupingInterval: 2000,       // Dedupe requests within 2 seconds
};

// Hook for fetching all polls
export function usePolls() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<Poll[]>(
    '/api/polls',
    fetcher,
    pollConfig
  );

  return {
    polls: data || [],
    isLoading,
    isError: error,
    refresh: revalidate,
  };
}

// Hook for fetching a single poll with real-time updates
export function usePoll(pollId: string | undefined) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<Poll>(
    pollId ? `/api/polls/${pollId}` : null,
    fetcher,
    {
      ...pollConfig,
      refreshInterval: 5000, // More frequent updates for active poll viewing
    }
  );

  return {
    poll: data,
    isLoading,
    isError: error,
    refresh: revalidate,
  };
}

// Hook for fetching poll messages
export function usePollMessages(pollId: string | undefined) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<Message[]>(
    pollId ? `/api/polls/${pollId}/messages` : null,
    fetcher,
    {
      ...pollConfig,
      refreshInterval: 3000, // Chat messages refresh faster
    }
  );

  return {
    messages: data || [],
    isLoading,
    isError: error,
    refresh: revalidate,
  };
}

// Hook for checking vote status
export function useVoteStatus(pollId: string | undefined, visitorId: string) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<VoteStatus>(
    pollId && visitorId ? `/api/polls/${pollId}/vote?visitorId=${visitorId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    voteStatus: data,
    isLoading,
    isError: error,
    refresh: revalidate,
  };
}

// Utility function to invalidate poll cache after mutations
export function invalidatePoll(pollId: string) {
  mutate(`/api/polls/${pollId}`);
  mutate(`/api/polls/${pollId}/vote`);
}

// Utility function to invalidate all polls cache
export function invalidatePolls() {
  mutate('/api/polls');
}

// Utility function to invalidate messages cache
export function invalidateMessages(pollId: string) {
  mutate(`/api/polls/${pollId}/messages`);
}
