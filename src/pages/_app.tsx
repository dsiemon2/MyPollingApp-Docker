import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useSettings } from '@/hooks/useSettings';

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
    </>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
