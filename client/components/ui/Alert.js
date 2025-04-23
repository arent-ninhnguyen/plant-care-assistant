import React from 'react';
import {
  FaCheckCircle, // Success
  FaTimesCircle, // Error
  FaInfoCircle,  // Info
  FaTimes        // Close icon
} from 'react-icons/fa';

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  let bgColor, textColor, Icon;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 border-green-400';
      textColor = 'text-green-700';
      Icon = FaCheckCircle;
      break;
    case 'error':
      bgColor = 'bg-red-100 border-red-400';
      textColor = 'text-red-700';
      Icon = FaTimesCircle;
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-100 border-blue-400';
      textColor = 'text-blue-700';
      Icon = FaInfoCircle;
      break;
  }

  return (
    <div
      className={`border-l-4 p-4 mb-4 rounded-md flex items-start ${bgColor} ${textColor}`}
      role="alert"
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0" aria-hidden="true" />
      <div className="flex-grow">
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 ${textColor} hover:opacity-75`}
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <FaTimes className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Alert; 