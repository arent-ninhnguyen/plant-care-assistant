'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function SignOut() {
  useEffect(() => {
    // Function to forcefully clear all session cookies
    const clearAuthCookies = () => {
      // Clear NextAuth specific cookies directly (domain and path specific)
      const cookieNames = [
        'next-auth.session-token',
        'next-auth.csrf-token', 
        'next-auth.callback-url',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ];
      
      const cookiePaths = ['/', '/api', '/auth'];
      
      // Thorough approach - try clearing with multiple path/domain combinations
      cookieNames.forEach(name => {
        cookiePaths.forEach(path => {
          document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `${name}=; path=${path}; domain=localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      });
      
      // Also try the general approach
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    };
    
    // Function to clear all localStorage
    const clearStorage = () => {
      try {
        // Clear specific items
        localStorage.removeItem('plantCareUser');
        
        // Also clear everything else to be safe
        localStorage.clear();
      } catch (err) {
        console.error('Error clearing localStorage:', err);
      }
    };
    
    // Execute all cleanup in sequence
    const logout = async () => {
      try {
        // First clear client-side storage
        clearStorage();
        
        // Then clear all cookies
        clearAuthCookies();
        
        // Then use the NextAuth signOut 
        await signOut({ redirect: false });
        
        console.log('Logged out successfully, redirecting...');
        
        // Finally force navigation
        window.location.href = '/';
      } catch (error) {
        console.error('Error during logout:', error);
        // Force navigation even if there was an error
        window.location.href = '/';
      }
    };
    
    // Start the logout process
    logout();
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <p>You are being signed out and redirected to the home page.</p>
        <div className="mt-4 animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
} 