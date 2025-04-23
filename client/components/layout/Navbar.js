'use client';

import Link from 'next/link';
// import { useRouter } from 'next/router'; // No longer needed for auth check
import { FaLeaf, FaSignOutAlt, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react'; // Import useSession and signOut
// import { useState, useEffect } from 'react'; // No longer needed for auth state

const Navbar = ({ className = '' }) => {
  // Get session status and data
  const { data: session, status } = useSession();

  const handleLogout = async (e) => {
    e.preventDefault();
    // Use NextAuth's signOut function
    await signOut({ callbackUrl: '/' }); // Redirect to home after logout
  };

  return (
    <nav className={`bg-white shadow-md ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary-600 flex items-center">
              <FaLeaf className="mr-2" /> 
              <span>Plant Care Assistant</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {status === 'loading' && (
              // Optional: Show a loading indicator
              <span className="text-sm text-gray-500">Loading...</span>
            )}

            {status === 'authenticated' && session?.user && (
              // User is logged in
              <>
                <span className="text-sm font-medium">
                  Welcome, {session.user.name || 'User'} {/* Display name from session, fallback to 'User' */}
                </span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-primary-600"
                >
                  <FaSignOutAlt className="mr-1" /> 
                  <span>Logout</span>
                </button>
              </>
            )}

            {status === 'unauthenticated' && (
              // User is not logged in
              <>
                <Link href="/auth/register" className="flex items-center text-gray-700 hover:text-primary-600">
                  <FaUserPlus className="mr-1" /> 
                  <span>Register</span>
                </Link>
                <Link href="/auth/login" className="flex items-center text-gray-700 hover:text-primary-600">
                  <FaSignInAlt className="mr-1" /> 
                  <span>Login</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 