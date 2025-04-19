'use client';

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import { FaExclamationTriangle } from 'react-icons/fa';
import ClientOnly from '../../components/common/ClientOnly';

export default function AuthError() {
  return (
    <ClientOnly>
      <AuthErrorContent />
    </ClientOnly>
  );
}

function AuthErrorContent() {
  const router = useRouter();
  const { error } = router.query;
  
  useEffect(() => {
    // You can automatically redirect after a delay
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md text-center">
      <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error || 'An unknown authentication error occurred'}
      </div>
      
      <p className="mb-6">You will be redirected to the login page shortly.</p>
      
      <Link href="/auth/login" className="btn btn-primary">
        Go to Login
      </Link>
    </div>
  );
} 