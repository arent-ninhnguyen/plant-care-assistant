'use client';

import Link from 'next/link';
import { useRouter } from 'next/router'; // <-- Import useRouter
import { FaLeaf, FaSignOutAlt, FaUserPlus, FaSignInAlt, FaUserCircle } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react'; // Import useSession and signOut
import Image from 'next/image'; // <-- Import Image
// import { useState, useEffect } from 'react'; // No longer needed for auth state

// --- Define Backend Origin (Consistent with other components) ---
let backendOrigin = 'http://localhost:5000'; // Default fallback
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    backendOrigin = apiUrl.origin; // e.g., http://localhost:5000
  } catch (e) {
    console.error('[Navbar] Invalid NEXT_PUBLIC_API_URL, using default origin.', e);
  }
}

// Helper function (Consistent with other components)
const getAbsoluteAvatarUrl = (relativeUrl) => {
  if (!relativeUrl || !relativeUrl.startsWith('/')) {
    return null;
  }
  return `${backendOrigin}${relativeUrl}`;
};

const Navbar = ({ className = '' }) => {
  const { data: session, status } = useSession();
  const router = useRouter(); // <-- Get router instance

  // Determine the target link for the logo
  const logoHref = status === 'authenticated' ? '/dashboard' : '/';

  // Routes where user-specific info should be hidden even if technically authenticated during transition
  const authRoutes = ['/auth/login', '/auth/register'];

  // Determine if we are on an auth page
  const onAuthPage = authRoutes.includes(router.pathname);

  // Construct avatar URL only if authenticated AND not on auth page
  const avatarUrl = status === 'authenticated' && !onAuthPage && session?.user?.avatarUrl
    ? getAbsoluteAvatarUrl(session.user.avatarUrl)
    : null;

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
            <Link href={logoHref} className="text-xl font-bold text-primary-600 flex items-center">
              <FaLeaf className="mr-2" />
              <span>Plant Care Assistant</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' && (
              // Optional: Show a loading indicator
              <span className="text-sm text-gray-500">Loading...</span>
            )}

            {/* Show User Info only if Authenticated AND NOT on an Auth Page */}
            {status === 'authenticated' && !onAuthPage && session?.user && (
              <>
                <Link href="/dashboard/profile" title="Go to Profile">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          console.warn('Navbar avatar failed to load:', avatarUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <FaUserCircle className="text-gray-400 w-6 h-6" />
                    )}
                  </div>
                </Link>
                <span className="text-sm font-medium">
                  Welcome, {session.user.name || 'User'}
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

            {/* Show Login/Register only if Unauthenticated OR on an Auth Page */}
            {(status === 'unauthenticated' || onAuthPage) && (
              <>
                {/* Optionally hide Register link if already on register page */}
                {!onAuthPage || router.pathname !== '/auth/register' ? (
                  <Link href="/auth/register" className="flex items-center text-gray-700 hover:text-primary-600">
                    <FaUserPlus className="mr-1" />
                    <span>Register</span>
                  </Link>
                ) : null}
                {/* Optionally hide Login link if already on login page */}
                {!onAuthPage || router.pathname !== '/auth/login' ? (
                  <Link href="/auth/login" className="flex items-center text-gray-700 hover:text-primary-600">
                    <FaSignInAlt className="mr-1" />
                    <span>Login</span>
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 