'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaUserPlus } from 'react-icons/fa';
import ClientOnly from '../../components/common/ClientOnly';

export default function Register() {
  return (
    <ClientOnly>
      <RegisterForm />
    </ClientOnly>
  );
}

// Separate component to avoid hydration errors
function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setSuccessMessage('');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    const backendRegisterUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL 
                               ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/users/register` 
                               : 'http://localhost:5000/api/users/register';

    try {
      console.log('Attempting registration via backend:', backendRegisterUrl);
      
      const response = await fetch(backendRegisterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });
      
      let responseData = {};
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
      }

      if (!response.ok) {
        const errorMessage = responseData.message || response.statusText || 'Registration failed';
        console.error('Backend registration failed:', errorMessage, 'Status:', response.status);
        throw new Error(errorMessage);
      }
      
      console.log('Registration successful, response data:', responseData); 
      setSuccessMessage('Account created successfully! Please log in.');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error caught:', err);
      setError(err.message || 'An error occurred during registration');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold flex items-center justify-center">
          <FaUserPlus className="mr-2" /> Register
        </h1>
        <p className="text-gray-600 mt-2">Create your account</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}
      {successMessage && (
         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
           {successMessage}
         </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name
          </label>
          <input
            className="form-input"
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
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
        
        <div className="mb-4">
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
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password2">
            Confirm Password
          </label>
          <input
            className="form-input"
            type="password"
            id="password2"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-800">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
} 