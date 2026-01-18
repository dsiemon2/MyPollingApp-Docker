import useSWR, { mutate } from 'swr';
import { PlanType, getPlanConfig, getPlanFeatures, PlanFeatures, PlanConfig } from '@/config/plans';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export interface SubscriptionData {
  plan: PlanType;
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
  activePolls: number;
}

export interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  planConfig: PlanConfig;
  features: PlanFeatures;
  isLoading: boolean;
  isError: boolean;
  // Feature checks
  canCreatePoll: boolean;
  canUseVoiceChat: boolean;
  canUseAiInsights: boolean;
  canUseAdvancedAi: boolean;
  canUseCustomBranding: boolean;
  canUseAnalytics: boolean;
  canUseApi: boolean;
  // Limits
  remainingPolls: number | null;
  // Helpers
  refresh: () => void;
}

export function useSubscription(userId?: string): UseSubscriptionReturn {
  const { data, error, isLoading } = useSWR<SubscriptionData>(
    userId ? `/api/subscription?userId=${userId}` : '/api/subscription',
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const plan: PlanType = data?.plan || 'FREE';
  const planConfig = getPlanConfig(plan);
  const features = getPlanFeatures(plan);
  const activePolls = data?.activePolls || 0;

  // Calculate remaining polls
  const remainingPolls = features.maxActivePolls === -1
    ? null
    : Math.max(0, features.maxActivePolls - activePolls);

  // Feature availability checks
  const canCreatePoll = features.maxActivePolls === -1 || activePolls < features.maxActivePolls;

  return {
    subscription: data || null,
    planConfig,
    features,
    isLoading,
    isError: !!error,
    canCreatePoll,
    canUseVoiceChat: features.voiceChat,
    canUseAiInsights: features.basicAiInsights || features.advancedAiInsights,
    canUseAdvancedAi: features.advancedAiInsights,
    canUseCustomBranding: features.customBranding,
    canUseAnalytics: features.analyticsDashboard,
    canUseApi: features.apiAccess,
    remainingPolls,
    refresh: () => mutate('/api/subscription'),
  };
}

export function invalidateSubscription() {
  mutate('/api/subscription');
}
