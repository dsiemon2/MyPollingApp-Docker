import useSWR, { mutate } from 'swr';

// Settings interface
export interface AppSettings {
  businessName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  timezone: string;
}

// Default settings
export const defaultSettings: AppSettings = {
  businessName: 'MyPollingApp',
  tagline: 'Voice-Enabled Polling',
  primaryColor: '#7c3aed',
  secondaryColor: '#4f46e5',
  logoUrl: '',
  timezone: 'America/New_York',
};

// Generic fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

// Hook for fetching app settings with SWR
export function useSettings() {
  const { data, error, isLoading } = useSWR<Record<string, string>>(
    '/api/admin/settings',
    fetcher,
    {
      refreshInterval: 0, // Don't auto-refresh settings
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      fallbackData: {},
    }
  );

  // Merge with defaults
  const settings: AppSettings = {
    ...defaultSettings,
    ...data,
  };

  return {
    settings,
    isLoading,
    isError: error,
    refresh: () => mutate('/api/admin/settings'),
  };
}

// Function to invalidate settings cache
export function invalidateSettings() {
  mutate('/api/admin/settings');
}

// Function to update settings
export async function updateSettings(newSettings: Partial<AppSettings>): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });

    if (response.ok) {
      // Invalidate cache to trigger refetch
      invalidateSettings();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
