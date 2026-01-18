// Plan configuration - defines limits and features for each subscription tier

export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface PlanFeatures {
  // Poll limits
  maxActivePolls: number;
  maxVotesPerPoll: number;

  // Poll types
  basicPollTypes: boolean;      // single_choice, multiple_choice, yes_no
  allPollTypes: boolean;        // includes rating_scale, nps, ranked, open_text

  // Features
  realTimeResults: boolean;
  voiceChat: boolean;
  basicAiInsights: boolean;
  advancedAiInsights: boolean;
  analyticsDashboard: boolean;
  customBranding: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  customIntegrations: boolean;

  // Support
  emailSupport: boolean;
  prioritySupport: boolean;
  dedicatedSupport: boolean;
}

export interface PlanConfig {
  name: string;
  displayName: string;
  price: number;
  priceLabel: string;
  description: string;
  features: PlanFeatures;
  badge?: string;
  isPopular?: boolean;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: 'FREE',
    displayName: 'Free',
    price: 0,
    priceLabel: '$0/mo',
    description: 'Perfect for trying it out',
    features: {
      maxActivePolls: 3,
      maxVotesPerPoll: 50,
      basicPollTypes: true,
      allPollTypes: false,
      realTimeResults: true,
      voiceChat: false,
      basicAiInsights: false,
      advancedAiInsights: false,
      analyticsDashboard: false,
      customBranding: false,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      emailSupport: false,
      prioritySupport: false,
      dedicatedSupport: false,
    },
  },
  STARTER: {
    name: 'STARTER',
    displayName: 'Starter',
    price: 9.99,
    priceLabel: '$9.99/mo',
    description: 'For small teams',
    features: {
      maxActivePolls: 10,
      maxVotesPerPoll: 200,
      basicPollTypes: true,
      allPollTypes: true,
      realTimeResults: true,
      voiceChat: true,
      basicAiInsights: true,
      advancedAiInsights: false,
      analyticsDashboard: false,
      customBranding: false,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      emailSupport: true,
      prioritySupport: false,
      dedicatedSupport: false,
    },
  },
  PROFESSIONAL: {
    name: 'PROFESSIONAL',
    displayName: 'Professional',
    price: 29.99,
    priceLabel: '$29.99/mo',
    description: 'For growing organizations',
    badge: 'MOST POPULAR',
    isPopular: true,
    features: {
      maxActivePolls: 50,
      maxVotesPerPoll: -1, // unlimited
      basicPollTypes: true,
      allPollTypes: true,
      realTimeResults: true,
      voiceChat: true,
      basicAiInsights: true,
      advancedAiInsights: true,
      analyticsDashboard: true,
      customBranding: true,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      emailSupport: true,
      prioritySupport: true,
      dedicatedSupport: false,
    },
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    price: 99,
    priceLabel: '$99/mo',
    description: 'For large organizations',
    features: {
      maxActivePolls: -1, // unlimited
      maxVotesPerPoll: -1, // unlimited
      basicPollTypes: true,
      allPollTypes: true,
      realTimeResults: true,
      voiceChat: true,
      basicAiInsights: true,
      advancedAiInsights: true,
      analyticsDashboard: true,
      customBranding: true,
      whiteLabel: true,
      apiAccess: true,
      customIntegrations: true,
      emailSupport: true,
      prioritySupport: true,
      dedicatedSupport: true,
    },
  },
};

// Basic poll types that are available on all plans
export const BASIC_POLL_TYPES = ['single_choice', 'multiple_choice', 'yes_no'];

// Advanced poll types that require Starter or higher
export const ADVANCED_POLL_TYPES = ['rating_scale', 'nps', 'ranked', 'open_text'];

// Helper functions
export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;
}

export function getPlanFeatures(plan: PlanType): PlanFeatures {
  return getPlanConfig(plan).features;
}

export function canCreatePoll(plan: PlanType, currentActivePolls: number): boolean {
  const features = getPlanFeatures(plan);
  if (features.maxActivePolls === -1) return true;
  return currentActivePolls < features.maxActivePolls;
}

export function canAcceptVote(plan: PlanType, currentVotes: number): boolean {
  const features = getPlanFeatures(plan);
  if (features.maxVotesPerPoll === -1) return true;
  return currentVotes < features.maxVotesPerPoll;
}

export function canUsePollType(plan: PlanType, pollTypeCode: string): boolean {
  const features = getPlanFeatures(plan);
  if (BASIC_POLL_TYPES.includes(pollTypeCode)) return true;
  if (ADVANCED_POLL_TYPES.includes(pollTypeCode)) return features.allPollTypes;
  return true; // Unknown types are allowed
}

export function canUseVoiceChat(plan: PlanType): boolean {
  return getPlanFeatures(plan).voiceChat;
}

export function canUseAiInsights(plan: PlanType): boolean {
  const features = getPlanFeatures(plan);
  return features.basicAiInsights || features.advancedAiInsights;
}

export function canUseAdvancedAi(plan: PlanType): boolean {
  return getPlanFeatures(plan).advancedAiInsights;
}

export function canUseCustomBranding(plan: PlanType): boolean {
  return getPlanFeatures(plan).customBranding;
}

export function canUseAnalytics(plan: PlanType): boolean {
  return getPlanFeatures(plan).analyticsDashboard;
}

export function canUseApi(plan: PlanType): boolean {
  return getPlanFeatures(plan).apiAccess;
}

export function getRemainingPolls(plan: PlanType, currentActivePolls: number): number | null {
  const features = getPlanFeatures(plan);
  if (features.maxActivePolls === -1) return null; // unlimited
  return Math.max(0, features.maxActivePolls - currentActivePolls);
}

export function getRemainingVotes(plan: PlanType, currentVotes: number): number | null {
  const features = getPlanFeatures(plan);
  if (features.maxVotesPerPoll === -1) return null; // unlimited
  return Math.max(0, features.maxVotesPerPoll - currentVotes);
}
