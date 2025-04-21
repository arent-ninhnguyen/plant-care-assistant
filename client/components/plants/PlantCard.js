'use client';

import { FaWater, FaSun, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { useState } from 'react';

const PlantCard = ({ plant, onEdit, onDelete }) => {
  // Default plant image if none provided
  const [imageError, setImageError] = useState(false);
  const imageSrc = plant.image && !imageError
    ? `/uploads/${plant.image}` 
    : '/images/default-plant.svg';
  
  // Map sunlight value to readable text
  const sunlightMap = {
    low: 'Low Light',
    medium: 'Medium Light',
    high: 'Bright Light'
  };
  
  return (
    <div className="card h-full flex flex-col">
      <div className="relative h-48">
        <img
          src={imageSrc}
          alt={plant.name}
          className="rounded-t-lg object-contain p-2 w-full h-full"
          onError={() => setImageError(true)}
        />
      </div>
      
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-semibold mb-1">{plant.name}</h3>
        
        {plant.species && (
          <p className="text-sm text-gray-600 italic mb-2">{plant.species}</p>
        )}
        
        {plant.location && (
          <div className="flex items-center text-sm mb-2">
            <FaMapMarkerAlt className="text-gray-400 mr-1" />
            <span>{plant.location}</span>
          </div>
        )}
        
        <div className="flex flex-wrap mt-3">
          {plant.waterFrequency && (
            <div className="flex items-center mr-4 text-sm mb-2">
              <FaWater className="text-blue-500 mr-1" />
              <span>{plant.waterFrequency}</span>
            </div>
          )}
          
          {plant.sunlight && (
            <div className="flex items-center text-sm mb-2">
              <FaSun className="text-yellow-500 mr-1" />
              <span>{sunlightMap[plant.sunlight] || plant.sunlight}</span>
            </div>
          )}
        </div>
        
        {plant.notes && (
          <div className="mt-2 text-sm text-gray-600">
            <p className="line-clamp-2">{plant.notes}</p>
          </div>
        )}
      </div>
      
      <div className="border-t px-4 py-2 flex justify-end">
        <button 
          onClick={() => onEdit(plant)}
          className="text-blue-500 hover:text-blue-700 mr-3"
          aria-label="Edit plant"
        >
          <FaEdit />
        </button>
        <button 
          onClick={() => onDelete(plant._id)}
          className="text-red-500 hover:text-red-700"
          aria-label="Delete plant"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default PlantCard; 