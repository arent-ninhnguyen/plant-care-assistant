'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Head from 'next/head';
import { useSession } from 'next-auth/react';

const Layout = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    if (!mounted) {
      setSidebarCollapsed(window.innerWidth < 768);
      setMounted(true);
    }
  }, [mounted]);

  const showSidebar = status === 'authenticated';

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
          <main className={`flex-grow transition-all duration-300 ease-in-out ${showSidebar ? (sidebarCollapsed ? 'md:ml-16' : 'md:ml-64') : 'ml-0'}`}>
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