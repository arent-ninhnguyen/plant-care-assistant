'use client';

import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Layout from '../components/layout/Layout';
import { AppProvider } from '../context/AppContext';
import { useState, useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration errors by only rendering on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Log session data changes for debugging
  useEffect(() => {
    if (pageProps.session) {
      console.log('Session data in _app.js:', pageProps.session);
    }
  }, [pageProps.session]);

  if (!isClient) {
    // Minimal SSR version to prevent hydration errors
    return <div className="loading-placeholder"></div>;
  }

  return (
    <SessionProvider 
      session={pageProps.session} 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
    >
      <AppProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppProvider>
    </SessionProvider>
  );
} 