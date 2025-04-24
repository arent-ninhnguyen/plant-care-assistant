'use client';

import { FaWater, FaSun, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// --- Define Backend Origin (Consistent with other components) ---
let backendOrigin = 'http://localhost:5000'; // Default fallback
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    backendOrigin = apiUrl.origin; // e.g., http://localhost:5000
  } catch (e) {
    console.error('[PlantCard] Invalid NEXT_PUBLIC_API_URL, using default origin.', e);
  }
}

// Helper function (Consistent with other components)
const getAbsoluteImageUrl = (relativeUrl) => {
  // --- MODIFIED: Return null if input is invalid --- 
  // If it's null, undefined, empty, or NOT a relative path starting with /, return null.
  if (!relativeUrl || typeof relativeUrl !== 'string' || !relativeUrl.startsWith('/')) {
     // Optional: Add warning for debugging
    // console.warn('[getAbsoluteImageUrl] Invalid or missing relativeUrl, returning null:', relativeUrl); 
    return null;
  }
   // Otherwise, construct the absolute URL.
  return `${backendOrigin}${relativeUrl}`; // Prepend origin
};

const PlantCard = ({ plant, onEdit, onDelete }) => {
  // console.log('[PlantCard] Rendering for plant:', plant?.name, 'Data:', plant);

  const [imageError, setImageError] = useState(false);
  
  // --- MODIFIED: Use helper function to get absolute URL ---
  const absoluteImageUrl = getAbsoluteImageUrl(plant?.image); 

  // console.log('[PlantCard] Constructed absoluteImageUrl:', absoluteImageUrl);
  
  // Use the absolute URL for error check and final source
  const finalImageSrc = imageError ? '/images/default-plant.svg' : absoluteImageUrl;

  // Reset error state if the plant image URL changes
  useEffect(() => {
      setImageError(false);
  }, [plant?.image]); // Depend on the relative path from the plant object

  const sunlightMap = {
    low: 'Low Light',
    medium: 'Medium Light',
    high: 'Bright Light'
  };
  
  const handleButtonClick = (e, action, actionType) => {
      // console.log(`Button click detected - Type: ${actionType}`);
      e.preventDefault();
      e.stopPropagation();
      action();
  };

  return (
    <Link href={`/plants/${plant._id}`} className="block hover:shadow-lg transition-shadow duration-200 rounded-lg h-full">
      <div className="card h-full flex flex-col bg-white rounded-lg overflow-hidden shadow-md">
        <div className="relative h-48 w-full">
          {/* Use finalImageSrc which handles errors and absolute URL */}
          {finalImageSrc && finalImageSrc !== '/images/default-plant.svg' ? (
            <Image
              key={finalImageSrc} // Key ensures re-render if src changes
              src={finalImageSrc} 
              alt={plant.name || 'Plant'}
              fill
              className="rounded-t-lg p-2 object-contain"
              onError={() => {
                console.error('[PlantCard] Image failed to load:', absoluteImageUrl);
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