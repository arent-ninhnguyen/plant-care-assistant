'use client';

import { FaWater, FaSun, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PlantCard = ({ plant, onEdit, onDelete }) => {
  console.log('[PlantCard] Rendering for plant:', plant?.name, 'Data:', plant);

  const [imageError, setImageError] = useState(false);
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
  const imageUrlPath = plant?.image ? `${backendUrl}/api/uploads/${plant.image}` : null;

  console.log('[PlantCard] Constructed imageUrlPath:', imageUrlPath);
  
  const imageSrcForErrorCheck = imageUrlPath;
  const finalImageSrc = imageError ? '/images/default-plant.svg' : imageUrlPath;

  useEffect(() => {
      setImageError(false);
  }, [plant?.image]);

  const sunlightMap = {
    low: 'Low Light',
    medium: 'Medium Light',
    high: 'Bright Light'
  };
  
  const handleButtonClick = (e, action, actionType) => {
      console.log(`Button click detected - Type: ${actionType}`);
      e.preventDefault();
      e.stopPropagation();
      action();
  };

  return (
    <Link href={`/plants/${plant._id}`} className="block hover:shadow-lg transition-shadow duration-200 rounded-lg h-full">
      <div className="card h-full flex flex-col bg-white rounded-lg overflow-hidden shadow-md">
        <div className="relative h-48 w-full">
          {finalImageSrc && finalImageSrc !== '/images/default-plant.svg' ? (
            <Image
              key={finalImageSrc}
              src={finalImageSrc}
              alt={plant.name || 'Plant'}
              fill
              className="rounded-t-lg p-2 object-contain"
              onError={() => {
                console.error('[PlantCard] Image failed to load:', imageSrcForErrorCheck);
                setImageError(true);
              }}
            />
          ) : (
            <Image
              src='/images/default-plant.svg'
              alt={plant.name || 'Default Plant'}
              fill
              className="rounded-t-lg p-2 object-contain"
            />
          )}
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
            onClick={(e) => handleButtonClick(e, () => onEdit(plant), 'edit')}
            className="text-blue-500 hover:text-blue-700 mr-3"
            aria-label="Edit plant"
          >
            <FaEdit />
          </button>
          <button 
            onClick={(e) => handleButtonClick(e, () => onDelete(plant._id), 'delete')}
            className="text-red-500 hover:text-red-700"
            aria-label="Delete plant"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default PlantCard; 