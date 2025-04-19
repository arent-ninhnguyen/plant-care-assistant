'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Head from 'next/head';

const Layout = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  // Handle any cleanup on first render
  useEffect(() => {
    // This runs only once on initial client-side render
    if (!mounted) {
      // Clear any stale auth data
      try {
        localStorage.removeItem('plantCareUser');
      } catch (err) {
        console.error('Error clearing localStorage:', err);
      }
    }
    
    setMounted(true);
  }, [mounted]);

  return (
    <>
      <Head>
        <title>Plant Care Assistant</title>
        <meta name="description" content="Track your plants and receive care reminders" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout; 