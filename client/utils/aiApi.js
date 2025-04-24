import { getSession } from 'next-auth/react';

// Base URL for the API (ensure consistency)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Use environment variable or fallback

// Helper function to get the auth token if needed for future AI routes
// Not strictly required for the current analysis endpoint if it doesn't use the 'auth' middleware
const getAuthToken = async () => {
  const session = await getSession();
  return session?.user?.accessToken; 
};

/**
 * Sends an image to the backend for AI analysis.
 * @param {File} imageFile - The plant image file to analyze.
 * @param {string} language - The desired language for the analysis.
 * @returns {Promise<object>} - The analysis result object (e.g., { analysis: "..." }).
 */
export const analyzePlantImage = async (imageFile, language = 'English') => {
  // const token = await getAuthToken(); // Uncomment if backend route requires auth
  // if (!token) throw new Error('Not authenticated'); // Uncomment if backend route requires auth

  const formData = new FormData();
  // Key 'plantImage' must match the key expected by multer on the backend
  formData.append('plantImage', imageFile); 
  formData.append('language', language);

  const response = await fetch(`${API_BASE_URL}/ai/analyze-plant-status`, {
    method: 'POST',
    headers: {
      // 'Content-Type' is automatically set by the browser for FormData
      // 'Authorization': `Bearer ${token}`, // Uncomment if backend route requires auth
    },
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      // Try to parse JSON error response from backend
      errorData = await response.json();
    } catch (e) {
      // If response isn't JSON, use text or a generic message
      errorData = { error: await response.text() || 'Failed to analyze image' };
    }
    // Throw an error with the message from the backend or a default
    throw new Error(errorData.error || 'Image analysis failed');
  }

  return response.json(); // Expect backend to return { analysis: "..." }
}; 