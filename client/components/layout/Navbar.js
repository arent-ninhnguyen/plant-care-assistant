'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaLeaf, FaSignOutAlt, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('User');
  const [mounted, setMounted] = useState(false);
  
  // Check authentication status whenever route changes
  useEffect(() => {
    const checkAuthStatus = () => {
      console.log('Current path:', window.location.pathname);
      
      // Consider logged in if we're on a protected route like dashboard
      const onProtectedRoute = window.location.pathname.startsWith('/dashboard');
      console.log('On protected route:', onProtectedRoute);
      
      // If we're on a protected route, we must be logged in
      if (onProtectedRoute) {
        setIsLoggedIn(true);
        
        // Get username from localStorage if possible
        try {
          const storedUser = localStorage.getItem('plantCareUser');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData && userData.name) {
              setUserName(userData.name);
            }
          }
        } catch (err) {
          console.error('Error reading from localStorage:', err);
        }
      } else {
        // For non-protected routes, check the auth cookie
        const hasAuthCookie = document.cookie.includes('next-auth.session-token');
        
        // Log cookie info for debugging
        console.log('Cookies:', document.cookie);
        console.log('Has auth cookie:', hasAuthCookie);
        
        setIsLoggedIn(hasAuthCookie);
        
        // If we're not on a protected route and don't have an auth cookie,
        // we're definitely not logged in
        if (!hasAuthCookie) {
          setIsLoggedIn(false);
        }
      }
    };
    
    // Only run on client-side
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
    
    setMounted(true);
  }, [router.pathname]); // Re-run when route changes

  const handleLogout = (e) => {
    e.preventDefault();
    
    // Clear cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear localStorage
    try {
      localStorage.clear();
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
    
    // Update UI immediately
    setIsLoggedIn(false);
    
    // Redirect to home
    window.location.href = '/';
  };

  // Don't render during SSR
  if (!mounted) return null;

  // Temporary fix: hardcode authentication state based on route
  const isOnDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
  const showLoggedInUI = isOnDashboard || isLoggedIn;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-600 flex items-center">
              <FaLeaf className="mr-2" /> 
              <span>Plant Care Assistant</span>
            </Link>
          </div>
          
          {showLoggedInUI ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Welcome, {userName}
              </span>
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-primary-600"
              >
                <FaSignOutAlt className="mr-1" /> 
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/register" className="flex items-center text-gray-700 hover:text-primary-600">
                <FaUserPlus className="mr-1" /> 
                <span>Register</span>
              </Link>
              <Link href="/auth/login" className="flex items-center text-gray-700 hover:text-primary-600">
                <FaSignInAlt className="mr-1" /> 
                <span>Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 