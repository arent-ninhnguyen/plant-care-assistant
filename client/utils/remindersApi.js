import axios from 'axios';
import { getSession } from 'next-auth/react';

// Base URL for the reminders API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/reminders`
  : 'http://localhost:5001/api/reminders';

// Helper function to get auth headers dynamically
const getAuthHeaders = async () => {
  const session = await getSession();
  const token = session?.user?.accessToken;

  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  } else {
    console.warn('Reminders API: No token found in session');
    return {};
  }
};

const remindersApi = {
  // Get all reminders for the user
  getReminders: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(API_URL, { headers });
      return response;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },

  // Create a new reminder
  createReminder: async (reminderData) => {
    // reminderData should include: plantId, type, dueDate, notes (optional)
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(API_URL, reminderData, { headers });
      return response;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Update an existing reminder
  updateReminder: async (id, updateData) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(`${API_URL}/${id}`, updateData, { headers });
      return response;
    } catch (error) {
      console.error(`Error updating reminder ${id}:`, error);
      throw error;
    }
  },

  // Mark a reminder as complete
  markComplete: async (id) => {
    try {
      const headers = await getAuthHeaders();
      // Backend uses PATCH /:id/complete
      const response = await axios.patch(`${API_URL}/${id}/complete`, {}, { headers });
      return response;
    } catch (error) {
      console.error(`Error marking reminder ${id} as complete:`, error);
      throw error;
    }
  },

  // Delete a reminder
  deleteReminder: async (id) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response;
    } catch (error) {
      console.error(`Error deleting reminder ${id}:`, error);
      throw error;
    }
  }
};

export default remindersApi; 