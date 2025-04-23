'use client';

import { useState } from 'react';
import remindersApi from '../../utils/remindersApi'; // Adjust path if needed
import { FaTimes } from 'react-icons/fa';

const ReminderForm = ({ plantId, plantName, onClose, onReminderAdded }) => {
  const [formData, setFormData] = useState({
    type: 'watering', // Default type
    dueDate: new Date().toISOString().split('T')[0], // Default to today
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.dueDate) {
      setError('Due date is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const reminderData = {
        ...formData,
        plantId: plantId,
      };
      const response = await remindersApi.createReminder(reminderData);
      
      if (onReminderAdded) {
        onReminderAdded(response.data); // Pass the new reminder back
      }
      if (onClose) {
        onClose(); // Close the form/modal
      }
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError(err.response?.data?.message || 'Failed to create reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Simple modal structure - consider using a dedicated modal component library later
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Add Reminder for {plantName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-grow">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                Reminder Type*
              </label>
              <select
                id="type"
                name="type"
                className="form-input w-full" // Ensure consistent styling
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="watering">Watering</option>
                <option value="fertilizing">Fertilizing</option>
                <option value="repotting">Repotting</option>
                <option value="pruning">Pruning</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                Due Date*
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="form-input w-full"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                className="form-input w-full"
                rows="3"
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button" // Should trigger form onSubmit via the wrapper, but onClick is clearer
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderForm; 