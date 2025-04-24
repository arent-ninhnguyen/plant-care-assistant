'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { FaQuestionCircle, FaLifeRing } from 'react-icons/fa'; // Help icons

const HelpPage = () => {
  const router = useRouter();
  // Get session status, even if content is public, 
  // to potentially personalize or show different info if logged in.
  const { data: session, status } = useSession(); 

  /* Optional: Redirect if auth is strictly required for Help
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Decide if unauthenticated users should be redirected
      // router.replace('/auth/login'); 
    }
  }, [status, router]);
  */

  // Display loading state while session status is determined
  if (status === 'loading') {
    return <div className="p-6 text-center">Loading help center...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold flex items-center">
        <FaQuestionCircle className="mr-3 text-primary-600" /> Help & Support
      </h1>

      {/* Help Content Placeholder */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-700 mb-4">
          Welcome to the Help Center! Find answers to common questions and learn how to use the Plant Care Assistant effectively.
        </p>

        {/* Example Section: FAQ */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FaLifeRing className="mr-2 text-blue-500" /> Frequently Asked Questions (FAQ)
          </h2>
          <div className="mt-4 space-y-2 text-gray-600">
            <p><strong>Q: How do I add a new plant?</strong></p>
            <p>A: Navigate to the "My Plants" section and click the "Add Plant" button.</p>
            <p><strong>Q: How are reminders set?</strong></p>
            <p>A: Reminders are automatically suggested based on common care needs, but you can customize them in the "Reminders" section.</p>
            {/* Add more FAQs */}
          </div>
        </div>

        {/* Example Section: Contact */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Contact Us</h2>
          <p className="mt-2 text-gray-600">
            If you need further assistance, please contact support at <a href="mailto:support@plantcare.example.com" className="text-primary-600 hover:underline">support@plantcare.example.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage; 