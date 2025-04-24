'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { FaCog } from 'react-icons/fa'; // Settings icon

const SettingsPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  // Should not happen if useEffect redirects, but good practice
  if (status === 'unauthenticated' || !session?.user) {
     return <div className="p-6 text-center">Access Denied. Please log in.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold flex items-center">
        <FaCog className="mr-3 text-primary-600" /> Settings
      </h1>

      {/* Settings Content Placeholder */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-700">
          Settings content will go here. You can add options for notifications, themes, data management, etc.
        </p>
        {/* Example setting section structure */}
        {/* 
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          <div className="mt-4 space-y-4">
             Add notification settings here 
          </div>
        </div> 
        */}
      </div>
    </div>
  );
};

export default SettingsPage; 