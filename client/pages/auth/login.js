'use client';

import { useState, useEffect } from 'react';
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
  const { callbackUrl, error: errorQuery } = router.query || {};

  // Clear any lingering auth state when loading the login page
  useEffect(() => {
    // Clear localStorage
    try {
      localStorage.removeItem('plantCareUser');
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  }, []);

  // Set error from query parameter if provided
  if (errorQuery && !error) {
    setError(decodeURIComponent(errorQuery));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', formData.email);
      
      // Use our custom credentials endpoint directly
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Login failed:', data);
        throw new Error(data.error || 'Invalid credentials');
      }
      
      console.log('Login successful, user data:', data.user);
      
      // Store user data in localStorage for custom session handling
      if (data.user) {
        try {
          // Make sure we're storing the user data with the expected structure
          const userToStore = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.user.accessToken || data.token || ''
          };
          
          console.log('Storing user in localStorage:', userToStore);
          localStorage.setItem('plantCareUser', JSON.stringify(userToStore));
          
          // Verify it was stored correctly
          const storedUser = JSON.parse(localStorage.getItem('plantCareUser'));
          console.log('Verified stored user:', storedUser);
          
          // Also store the token separately for easier access
          if (data.token) {
            localStorage.setItem('accessToken', data.token);
          }
        } catch (err) {
          console.error('Error storing user data:', err);
        }
      }
      
      // Wait a moment for NextAuth to fully process the login
      setTimeout(() => {
        // Hard redirect to dashboard or callback URL
        window.location.href = data.url || callbackUrl || '/dashboard';
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
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
            className="form-input"
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
            className="form-input"
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
          className="w-full btn btn-primary"
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