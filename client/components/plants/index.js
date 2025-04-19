'use client';

import Link from 'next/link';
import { FaTint, FaSun, FaEdit, FaTrash } from 'react-icons/fa';

export function PlantCard({ plant, onDelete }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {plant.imageUrl && (
        <div className="h-40 overflow-hidden">
          <img 
            src={plant.imageUrl} 
            alt={plant.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-lg">{plant.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{plant.species}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center">
            <FaTint className="mr-1" /> {plant.wateringFrequency} days
          </span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center">
            <FaSun className="mr-1" /> {plant.lightRequirements}
          </span>
        </div>
        
        <div className="flex justify-between mt-3">
          <Link href={`/plants/${plant._id}`} className="text-primary-600 hover:text-primary-800 text-sm">
            View Details
          </Link>
          <div className="flex space-x-2">
            <Link href={`/plants/edit/${plant._id}`} className="text-gray-600 hover:text-gray-800">
              <FaEdit />
            </Link>
            {onDelete && (
              <button 
                onClick={() => onDelete(plant._id)} 
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlantCard; 