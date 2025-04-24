import { getSession } from 'next-auth/react';

// Helper function to get the auth token
const getAuthToken = async () => {
  const session = await getSession();
  // console.log('Session object in getAuthToken:', session); // Removed log
  return session?.user?.accessToken; // Corrected path to token
};

// Base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Use environment variable or fallback

/**
 * Updates the user's name.
 * @param {string} name - The new name.
 * @returns {Promise<object>} - The updated user object.
 */
export const updateUserName = async (name) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update name');
  }

  return response.json();
};

/**
 * Updates the user's password.
 * @param {string} currentPassword - The current password.
 * @param {string} newPassword - The new password.
 * @returns {Promise<object>} - The success message.
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/users/me/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Handle cases where the response is not JSON (e.g., plain text or HTML error page)
      errorData = { message: await response.text() || 'Failed to update password' };
    }
    throw new Error(errorData.message || 'Failed to update password');
  }

  return response.json();
};

/**
 * NEW: Updates the user's avatar.
 * @param {File} avatarFile - The avatar image file.
 * @returns {Promise<object>} - The updated user object (including new avatarUrl).
 */
export const updateUserAvatar = async (avatarFile) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('avatar', avatarFile); // Key 'avatar' must match backend (multer field name)

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: 'PUT',
    headers: {
      // 'Content-Type' is automatically set to 'multipart/form-data' by the browser with FormData
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: await response.text() || 'Failed to upload avatar' };
    }
    throw new Error(errorData.message || 'Failed to upload avatar');
  }

  return response.json(); // Expect backend to return updated user data
}; 