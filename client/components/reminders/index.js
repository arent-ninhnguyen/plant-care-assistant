'use client';

import { useState } from 'react';
import { FaTint, FaLeaf, FaCheckCircle, FaCircle } from 'react-icons/fa';
import axios from 'axios';
import { useSession } from 'next-auth/react';

export function ReminderItem({ reminder, onComplete, onDelete }) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'watering':
        return <FaTint className="text-blue-500" />;
      case 'fertilizing':
        return <FaLeaf className="text-green-500" />;
      default:
        return <FaLeaf className="text-primary-500" />;
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const handleComplete = async () => {
    if (!onComplete) return;
    
    setIsLoading(true);
    try {
      await onComplete(reminder._id);
    } catch (error) {
      console.error("Error completing reminder:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`border rounded-lg p-3 hover:shadow-sm transition-shadow ${
      reminder.completed ? 'bg-gray-50' : 'bg-white'
    }`}>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          {reminder.completed ? (
            <FaCheckCircle className="text-green-500" />
          ) : (
            <button 
              onClick={handleComplete}
              disabled={isLoading}
              className="hover:text-green-500 transition-colors"
            >
              <FaCircle className="text-gray-300" />
            </button>
          )}
          <div>
            <h4 className="font-medium flex items-center">
              {getTypeIcon(reminder.type)}
              <span className="ml-2">
                {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}
              </span>
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {reminder.plantId?.name || 'Unknown plant'}
            </p>
          </div>
        </div>
        
        <span className={`text-xs px-2 py-1 rounded self-start ${
          new Date(reminder.dueDate) < new Date() && !reminder.completed 
            ? 'bg-red-100 text-red-800' 
            : 'bg-primary-100 text-primary-800'
        }`}>
          {formatDate(reminder.dueDate)}
        </span>
      </div>
      
      {reminder.notes && (
        <p className="text-xs text-gray-500 mt-2 ml-6">{reminder.notes}</p>
      )}
    </div>
  );
}

export default ReminderItem; 