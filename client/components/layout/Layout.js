'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Head from 'next/head';
import { useRouter } from 'next/router';

const Layout = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Handle any cleanup on first render and check if we should show sidebar
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
    
    // Determine if we should show the sidebar based on the route or auth status
    const isOnDashboard = window.location.pathname.startsWith('/dashboard');
    const hasAuthCookie = document.cookie.includes('next-auth.session-token');
    
    setShowSidebar(isOnDashboard || hasAuthCookie);
    
    // On mobile, start with collapsed sidebar
    setSidebarCollapsed(window.innerWidth < 768);
    
    setMounted(true);
  }, [mounted, router.pathname]);

  // Function to toggle sidebar state (passed to Sidebar component)
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <>
      <Head>
        <title>Plant Care Assistant</title>
        <meta name="description" content="Track your plants and receive care reminders" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Navbar className={showSidebar ? 'navbar-with-sidebar' : ''} />
        <div className="flex flex-grow relative">
          {mounted && showSidebar && (
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
          )}
          <main className={`flex-grow ${showSidebar ? (sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded') : ''}`}>
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
        <Footer className={showSidebar ? 'navbar-with-sidebar' : ''} />
      </div>
    </>
  );
};

export default Layout; 