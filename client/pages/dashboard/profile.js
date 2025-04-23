'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaUserCircle, FaEdit, FaLock } from 'react-icons/fa';
import { updateUserName, updateUserPassword } from '../../utils/userApi';
import Alert from '../../components/ui/Alert';

const ProfilePage = () => {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  // State for name update
  const [name, setName] = useState('');
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState({ type: '', text: '' });

  // State for password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    } else if (session?.user?.name) {
      // Initialize name field with current name
      setName(session.user.name);
    }
  }, [status, router, session]);

  if (status === 'loading') {
    return <div className="p-6 text-center">Loading profile...</div>;
  }

  // Should not happen if useEffect redirects, but good practice
  if (status === 'unauthenticated' || !session?.user) {
     return <div className="p-6 text-center">Access Denied. Please log in.</div>;
  }

  const { user } = session; // Destructure user from session

  // --- Handlers ---

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    if (!name || name === user.name) {
      setNameMessage({ type: 'info', text: 'Please enter a new name.' });
      return;
    }
    setIsNameLoading(true);
    setNameMessage({ type: '', text: '' }); // Clear previous messages

    try {
      await updateUserName(name);
      setNameMessage({ type: 'success', text: 'Name updated successfully!' });
      // Update the session client-side
      await updateSession({ user: { ...session.user, name: name } });
      // You might also want to refetch the session to ensure it's fully updated
      // await getSession(); // Requires importing getSession
    } catch (error) {
      setNameMessage({ type: 'error', text: error.message || 'Failed to update name.' });
    } finally {
      setIsNameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'info', text: 'Please fill in both current and new passwords.' });
      return;
    }
    setIsPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' }); // Clear previous messages

    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      // Clear password fields after success
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to update password.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold flex items-center">
        <FaUserCircle className="mr-3 text-primary-600" /> Your Profile
      </h1>

      {/* User Info Display */}
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">Current Name</label>
          <p className="text-lg text-gray-800">{user.name || 'N/A'}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <p className="text-lg text-gray-800">{user.email || 'N/A'}</p>
        </div>
      </div>

      {/* Update Name Form */}
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
         <h2 className="text-xl font-semibold mb-4 flex items-center">
           <FaEdit className="mr-2 text-blue-500" /> Update Name
         </h2>
         {nameMessage.text && <Alert type={nameMessage.type} message={nameMessage.text} onClose={() => setNameMessage({ type: '', text: '' })} />}
         <form onSubmit={handleNameUpdate} className="space-y-4">
           <div>
             <label htmlFor="name" className="block text-sm font-medium text-gray-700">
               New Name
             </label>
             <input
               type="text"
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
             />
           </div>
           <button
             type="submit"
             disabled={isNameLoading || !name || name === user.name}
             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isNameLoading ? 'Updating...' : 'Update Name'}
           </button>
         </form>
      </div>

      {/* Update Password Form */}
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto">
         <h2 className="text-xl font-semibold mb-4 flex items-center">
           <FaLock className="mr-2 text-red-500" /> Update Password
         </h2>
         {passwordMessage.text && <Alert type={passwordMessage.type} message={passwordMessage.text} onClose={() => setPasswordMessage({ type: '', text: '' })} />}
         <form onSubmit={handlePasswordUpdate} className="space-y-4">
           <div>
             <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
               Current Password
             </label>
             <input
               type="password"
               id="currentPassword"
               value={currentPassword}
               onChange={(e) => setCurrentPassword(e.target.value)}
               required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
             />
           </div>
           <div>
             <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
               New Password
             </label>
             <input
               type="password"
               id="newPassword"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
             />
           </div>
           <button
             type="submit"
             disabled={isPasswordLoading || !currentPassword || !newPassword}
             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isPasswordLoading ? 'Updating...' : 'Update Password'}
           </button>
         </form>
      </div>
    </div>
  );
};

export default ProfilePage; 