import axios from 'axios';
import { getSession } from 'next-auth/react'; // Import getSession

// Set the API URL to point directly to the backend server
const API_URL = 'http://localhost:5000/api/plants';

// Helper function to get auth headers dynamically
const getAuthHeaders = async () => {
  const session = await getSession();
  const token = session?.user?.accessToken;
  
  if (token) {
    // console.log('API Request will include Authorization header');
    return { 'Authorization': `Bearer ${token}` };
  } else {
    console.warn('API Request will NOT include Authorization header - no token found in session');
    return {};
  }
};

const plantsApi = {
  // Get all plants for the authenticated user
  getPlants: async () => {
    try {
      const headers = await getAuthHeaders();
      console.log('Making GET request to:', API_URL);
      // Use axios directly with dynamic headers and absolute URL
      const response = await axios.get(API_URL, { headers });
      return response;
    } catch (error) {
      console.error('Error fetching plants:', error);
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
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response;
    } catch (error) {
      console.error(`Error fetching plant ${id}:`, error);
      throw error;
    }
  },
  
  // Add a new plant (with image upload support via FormData)
  addPlant: async (plantData) => {
    try {
      const headers = await getAuthHeaders();
      // Add Content-Type for FormData
      headers['Content-Type'] = 'multipart/form-data';
      
      const response = await axios.post(API_URL, plantData, { headers });
      return response;
    } catch (error) {
      console.error('Error adding plant:', error);
      throw error;
    }
  },
  
  // Update an existing plant
  updatePlant: async (id, plantData) => {
    try {
      const headers = await getAuthHeaders();
      let response;
      // If plantData is FormData (has an image), use multipart/form-data
      if (plantData instanceof FormData) {
        headers['Content-Type'] = 'multipart/form-data';
        response = await axios.put(`${API_URL}/${id}`, plantData, { headers });
      } else {
        // Otherwise use regular JSON (axios default)
        response = await axios.put(`${API_URL}/${id}`, plantData, { headers });
      }
      return response;
    } catch (error) {
      console.error(`Error updating plant ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a plant
  deletePlant: async (id) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response;
    } catch (error) {
      console.error(`Error deleting plant ${id}:`, error);
      throw error;
    }
  }
};

export default plantsApi; 