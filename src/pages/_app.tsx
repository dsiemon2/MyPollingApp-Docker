import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AIAssistantProvider } from '@/contexts/AIAssistantContext';
import { useSettings } from '@/hooks/useSettings';
import dynamic from 'next/dynamic';

// Dynamic import for AI Chat Slider to avoid SSR issues with localStorage
const AIChatSlider = dynamic(() => import('@/components/AIChatSlider'), {
  ssr: false,
});

function AppContent({ Component, pageProps }: { Component: AppProps['Component']; pageProps: any }) {
  const { settings } = useSettings();

  return (
    <>
      <Head>
        <title>{settings.businessName} - {settings.tagline}</title>
        <meta name="description" content="Create polls and discuss with voice chat" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
      <AIChatSlider />
    </>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <AIAssistantProvider>
          <AppContent Component={Component} pageProps={pageProps} />
        </AIAssistantProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
