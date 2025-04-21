import axios from 'axios';

// Set the API URL to point directly to the backend server
const API_URL = 'http://localhost:5000/api/plants';

// Get auth token from cookies or localStorage with better error handling
const getAuthToken = () => {
  // Try to get from localStorage first
  let token = null;
  
  try {
    // Priority 1: Try the dedicated accessToken first (set during direct login)
    token = localStorage.getItem('accessToken');
    if (token) {
      console.log('Using dedicated accessToken from localStorage');
      return token;
    }
    
    // Priority 2: Try the user object in localStorage
    const userData = localStorage.getItem('plantCareUser');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData && parsedData.accessToken) {
          console.log('Using accessToken from plantCareUser object');
          return parsedData.accessToken;
        } else {
          console.warn('plantCareUser exists but contains no accessToken');
        }
      } catch (parseError) {
        console.error('Error parsing plantCareUser JSON:', parseError);
      }
    }
    
    // Priority 3: Check for NextAuth session token
    const nextAuthData = localStorage.getItem('next-auth.session-token');
    if (nextAuthData) {
      console.log('Using next-auth session token');
      return nextAuthData;
    }
    
    // Priority 4: Try to get token from cookie as last resort
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('next-auth.session-token=')
      );
      
      if (tokenCookie) {
        const cookieToken = tokenCookie.split('=')[1];
        console.log('Using token from cookie');
        return cookieToken;
      }
    }
    
    console.warn('No authentication token found in any storage location');
    return null;
  } catch (error) {
    console.error('Error accessing token storage:', error);
    return null;
  }
};

// Configure axios instance with auth header
const configureAxios = () => {
  const token = getAuthToken();
  
  // Log token status for debugging
  if (token) {
    console.log('API Request will include Authorization header');
  } else {
    console.warn('API Request will NOT include Authorization header - no token available');
  }
  
  // Create an instance with the base URL and headers
  return axios.create({
    baseURL: API_URL,
    headers: token ? {
      'Authorization': `Bearer ${token}`
    } : {}
  });
};

const plantsApi = {
  // Get all plants for the authenticated user
  getPlants: async () => {
    try {
      const api = configureAxios();
      console.log('Making GET request to:', API_URL);
      return await api.get('/');
    } catch (error) {
      console.error('Error fetching plants:', error);
      // Add details about the error for better debugging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Get a single plant by ID
  getPlant: async (id) => {
    try {
      const api = configureAxios();
      return await api.get(`/${id}`);
    } catch (error) {
      console.error(`Error fetching plant ${id}:`, error);
      throw error;
    }
  },
  
  // Add a new plant (with image upload support via FormData)
  addPlant: async (plantData) => {
    try {
      // Ensure Authorization header is preserved with form data
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'multipart/form-data'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Create a fresh axios instance directly for this request
      const response = await axios.post(API_URL, plantData, { 
        headers,
        baseURL: '' // Override the baseURL to use the absolute URL
      });
      
      return response;
    } catch (error) {
      console.error('Error adding plant:', error);
      throw error;
    }
  },
  
  // Update an existing plant
  updatePlant: async (id, plantData) => {
    try {
      // If plantData is FormData (has an image), use multipart/form-data
      if (plantData instanceof FormData) {
        // Ensure Authorization header is preserved with form data
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'multipart/form-data'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Create a fresh axios instance directly for this request
        return await axios.put(`${API_URL}/${id}`, plantData, { 
          headers,
          baseURL: '' // Override the baseURL to use the absolute URL
        });
      }
      
      // Otherwise use regular JSON
      const api = configureAxios();
      return await api.put(`/${id}`, plantData);
    } catch (error) {
      console.error(`Error updating plant ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a plant
  deletePlant: async (id) => {
    try {
      const api = configureAxios();
      return await api.delete(`/${id}`);
    } catch (error) {
      console.error(`Error deleting plant ${id}:`, error);
      throw error;
    }
  }
};

export default plantsApi; 