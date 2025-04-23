'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react'; // Import signIn
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaSignInAlt } from 'react-icons/fa';
import ClientOnly from '../../components/common/ClientOnly';

export default function Login() {
  return (
    <ClientOnly>
      <LoginForm />
    </ClientOnly>
  );
}

// Separate the form logic to avoid hydration issues
function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  // Get callbackUrl and potential error from query parameters
  const { callbackUrl, error: queryError } = router.query || {}; 

  // Set error from query parameter if provided (e.g., from NextAuth redirect)
  useEffect(() => {
    if (queryError && !error) { // Only set if no local error is already present
      // Map common NextAuth error messages
      if (queryError === "CredentialsSignin") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(decodeURIComponent(queryError));
      }
    }
  }, [queryError, error]); // Depend on queryError and local error state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors on new submission
    
    try {
      console.log('Attempting login via NextAuth signIn for:', formData.email);

      // Use NextAuth's signIn function
      const result = await signIn('credentials', {
        redirect: false, // We will handle redirection manually based on the result
        email: formData.email,
        password: formData.password,
      });

      console.log('NextAuth signIn result:', result);

      if (result.error) {
        // Handle authentication errors (e.g., invalid credentials)
        // Map common NextAuth error messages for user-friendliness
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
        } else {
           setError(result.error); // Show other errors directly
        }
        setIsLoading(false);
      } else if (result.ok) {
        // Authentication successful
        // Redirect to the intended page (callbackUrl) or the dashboard
        console.log('Login successful, redirecting...');
        // Use replace to avoid the login page being in browser history
        router.replace(callbackUrl || '/dashboard'); 
        // No need to setIsLoading(false) as we are navigating away
      } else {
        // Handle unexpected non-error, non-ok result (should not happen often)
        setError('An unknown login error occurred.');
        setIsLoading(false);
      }
    } catch (err) {
      // Handle unexpected errors during the signIn process itself
      console.error('Unexpected Login error:', err);
      setError(err.message || 'An unexpected error occurred during login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold flex items-center justify-center">
          <FaSignInAlt className="mr-2" /> Login
        </h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            className="form-input w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" // Added basic styling
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="form-input w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" // Added basic styling
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50" // Added basic styling
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary-600 hover:text-primary-800">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
} 