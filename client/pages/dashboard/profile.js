'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { FaUserCircle, FaEdit, FaLock, FaCamera, FaUpload } from 'react-icons/fa';
import imageCompression from 'browser-image-compression'; // Import the library
import { updateUserName, updateUserPassword, updateUserAvatar } from '../../utils/userApi';
import Alert from '../../components/ui/Alert';

// --- NEW: Define Backend Origin ---
// Attempt to get the origin from the full API URL environment variable
let backendOrigin = 'http://localhost:5000'; // Default fallback
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    backendOrigin = apiUrl.origin; // e.g., http://localhost:5000
  } catch (e) {
    console.error('Invalid NEXT_PUBLIC_API_URL, using default origin.', e);
  }
}

// Helper function to create absolute URL
const getAbsoluteAvatarUrl = (relativeUrl) => {
  if (!relativeUrl || !relativeUrl.startsWith('/')) {
    // Return null if path is invalid or missing to avoid broken image icons
    return null;
  }
  // Prepend origin ONLY (removing /api)
  return `${backendOrigin}${relativeUrl}`; // Example: http://localhost:5000/uploads/avatars/...
};

const ProfilePage = () => {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const fileInputRef = useRef(null);

  // State for name update
  const [name, setName] = useState('');
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState({ type: '', text: '' });

  // State for password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // NEW: State for avatar update
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });

  // --- Effects ---
  useEffect(() => {
    // console.log('[Effect Run] Status:', status, 'Session User:', session?.user);
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    } else if (session?.user) {
      // Set name on load/session change
      setName(session.user.name || '');

      // --- REVISED LOGIC: Only set INITIAL avatar preview --- 
      if (avatarPreview === null) { // Check if preview is not already set (by local selection or previous load)
        const sessionAvatarAbsoluteUrl = getAbsoluteAvatarUrl(session.user.avatarUrl);
        console.log('[Effect Run - Initial Load?] Setting avatarPreview from session data:', sessionAvatarAbsoluteUrl); // Log the constructed URL
        // Only set if the URL is valid
        if (sessionAvatarAbsoluteUrl) {
          setAvatarPreview(sessionAvatarAbsoluteUrl);
        } else {
          setAvatarPreview(null); // Ensure it's null if URL construction failed
        }
      }
    }
    // Depend only on session, status, router for initial load and auth changes
  }, [status, router, session]);

  // Effect to clean up preview URL
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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
      const updatedUser = await updateUserName(name);
      setNameMessage({ type: 'success', text: 'Name updated successfully!' });
      // Pass the existing session data merged with name update,
      // ensuring avatarUrl remains the RELATIVE path store in the session.
      const updatedSessionData = { ...session.user, name: updatedUser.name }; // Only update the name
      await updateSession({ user: updatedSessionData });
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

  // NEW: Avatar Handlers
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarMessage({ type: '', text: '' });
    } else {
      setAvatarFile(null);
      setAvatarPreview(getAbsoluteAvatarUrl(user.avatarUrl) || null);
      setAvatarMessage({ type: 'error', text: 'Please select a valid image file.' });
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setAvatarMessage({ type: 'info', text: 'Please select an image file first.' });
      return;
    }
    setIsAvatarLoading(true);
    setAvatarMessage({ type: '', text: '' });

    try {
      // --- Image Compression --- 
      console.log(`Original file size: ${avatarFile.size / 1024 / 1024} MB`);
      const options = {
        maxSizeMB: 4.5, // Target slightly less than backend limit (5MB)
        maxWidthOrHeight: 1024, // Resize to a reasonable dimension
        useWebWorker: true,
      };

      let fileToUpload = avatarFile;
      // Only compress if the file exceeds the target size
      if (avatarFile.size > options.maxSizeMB * 1024 * 1024) {
        console.log('Compressing image...');
        try {
          fileToUpload = await imageCompression(avatarFile, options);
          console.log(`Compressed file size: ${fileToUpload.size / 1024 / 1024} MB`);
        } catch (compressionError) {
          console.error('Image compression failed:', compressionError);
          // Optionally notify user, but proceed with original file for now
          setAvatarMessage({ type: 'warning', text: 'Could not compress image, attempting to upload original.' });
          // fileToUpload remains the original avatarFile
        }
      } else {
        console.log('Image size is within limit, no compression needed.');
      }
      // --- End Compression --- 

      // Use fileToUpload (original or compressed) for the API call
      const updatedUserData = await updateUserAvatar(fileToUpload);
      console.log('Backend response after avatar upload:', updatedUserData);

      setAvatarMessage({ type: 'success', text: 'Avatar updated successfully!' });
      setAvatarFile(null); // Clear the file state

      const absoluteAvatarUrl = getAbsoluteAvatarUrl(updatedUserData?.avatarUrl);
      console.log('Absolute avatar URL constructed:', absoluteAvatarUrl);

      // Update session with the RELATIVE path, but use absolute for preview
      await updateSession({ user: { ...session.user, avatarUrl: updatedUserData?.avatarUrl } }); // Use relative path from backend response
      setAvatarPreview(absoluteAvatarUrl); // Use absolute path for immediate preview

    } catch (error) {
      console.error('Error during avatar upload:', error);
      setAvatarMessage({ type: 'error', text: error.message || 'Failed to upload avatar.' });
      setAvatarPreview(getAbsoluteAvatarUrl(session.user.avatarUrl) || null);
    } finally {
      setIsAvatarLoading(false);
    }
  };

  // --- Render ---
  console.log('Rendering ProfilePage, avatarPreview state:', avatarPreview);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold flex items-center">
        <FaUserCircle className="mr-3 text-primary-600" /> Your Profile
      </h1>

      {/* User Info Display */}
      <div className="bg-white shadow-md rounded-lg p-6 max-w-lg mx-auto mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-2">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-full h-full rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <FaUserCircle className="w-full h-full text-gray-400" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-1.5 shadow-md"
              aria-label="Change avatar"
              title="Change avatar"
            >
              <FaCamera className="w-3 h-3" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="avatar-upload"
          />
          {avatarFile && (
            <button
              type="button"
              onClick={handleAvatarUpload}
              disabled={isAvatarLoading}
              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <FaUpload className="mr-1.5 h-3 w-3" />
              {isAvatarLoading ? 'Uploading...' : 'Upload'}
            </button>
          )}
          {avatarMessage.text && <Alert type={avatarMessage.type} message={avatarMessage.text} onClose={() => setAvatarMessage({ type: '', text: '' })} />}
        </div>

        {/* User Details Section */}
        <div className="flex-grow text-center md:text-left">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">Current Name</label>
            <p className="text-lg text-gray-800">{user.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-lg text-gray-800">{user.email || 'N/A'}</p>
          </div>
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