'use client';

import { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import plantsApi from '../../utils/plantsApi';
import { isPlantImage } from '../../utils/plantRecognition';
import Image from 'next/image';

// --- Define Backend Origin (Consistent with profile page) ---
let backendOrigin = 'http://localhost:5000'; // Default fallback
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    backendOrigin = apiUrl.origin; // e.g., http://localhost:5000
  } catch (e) {
    console.error('[EditPlantForm] Invalid NEXT_PUBLIC_API_URL, using default origin.', e);
  }
}

// Helper function (Consistent with profile page)
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

const EditPlantForm = ({ plant, onClose, onPlantUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    location: '',
    waterFrequency: '',
    sunlight: 'medium',
    notes: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [imageVerificationResult, setImageVerificationResult] = useState(null);
  
  // Initialize form with plant data
  useEffect(() => {
    if (plant) {
      setFormData({
        name: plant.name || '',
        species: plant.species || '',
        location: plant.location || '',
        waterFrequency: plant.waterFrequency || '',
        sunlight: plant.sunlight || 'medium',
        notes: plant.notes || ''
      });
      
      // --- MODIFIED: Use helper for initial image preview ---
      if (plant.image) {
        setImagePreview(getAbsoluteImageUrl(plant.image));
      } else {
        setImagePreview(null); // Ensure preview is null if no image
      }
      setImageFile(null); // Reset file input state on load
      setShouldDeleteImage(false); // Reset delete flag
      setError(null); // Clear any previous errors
      setImageVerificationResult(null); // Clear verification
    }
  }, [plant]); // Rerun only when the plant prop changes
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
      setError('Please upload an image file (JPEG, PNG or GIF)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setImageFile(file);
    setShouldDeleteImage(false); // Reset delete flag when uploading new image
    
    // Create preview (blob URL)
    const reader = new FileReader();
    reader.onload = async (e) => {
      setImagePreview(e.target.result);
      
      // Verify if image contains a plant
      try {
        setIsVerifyingImage(true);
        setImageVerificationResult(null);
        
        // Short delay to allow the UI to update before potentially heavy processing
        setTimeout(async () => {
          const result = await isPlantImage(file);
          setImageVerificationResult(result);
          setIsVerifyingImage(false);
          
          if (!result.isPlant) {
            setError(`This doesn\'t appear to be a plant image. The system detected: ${result.className}`);
          } else {
            setError(null);
          }
        }, 100);
      } catch (verifyError) {
        console.error('Error verifying plant image:', verifyError);
        setIsVerifyingImage(false);
      }
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };
  
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setShouldDeleteImage(true); // Set flag to delete image on server
    setImageVerificationResult(null);
    setError(null); 
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!formData.name) {
      setError('Plant name is required');
      return;
    }
    
    // Block submission if new image was verified as not being a plant
    if (imageFile && imageVerificationResult && !imageVerificationResult.isPlant) {
      setError(`Cannot submit a non-plant image. The system detected: ${imageVerificationResult.className}`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create FormData object for file upload
      const uploadData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        uploadData.append(key, formData[key]);
      });
      
      // Add image if a new one was selected
      if (imageFile) {
        uploadData.append('plantImage', imageFile);
      }
      
      // Add flag to delete image if needed
      if (shouldDeleteImage) {
        uploadData.append('deleteImage', 'true');
      }
      
      // Submit to API
      const response = await plantsApi.updatePlant(plant._id, uploadData);
      
      // Success
      if (onPlantUpdated) {
        onPlantUpdated(response.data);
      }
      
      // Close form
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error updating plant:', err);
      setError(err.response?.data?.error || 'Failed to update plant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderErrorMessage = () => {
    if (!error) return null;
    
    const isNonPlantError = error.includes("doesn\'t appear to be a plant") || error.includes("Cannot submit a non-plant image");
    
    return (
      <div className={`mb-4 px-4 py-3 rounded ${isNonPlantError ? 'bg-red-100 border-2 border-red-500 text-red-800' : 'bg-red-100 border border-red-400 text-red-700'}`}>
        {isNonPlantError && (
          <div className="flex items-center mb-2">
            <FaExclamationTriangle className="text-red-600 mr-2" />
            <span className="font-bold">Non-Plant Image Detected</span>
          </div>
        )}
        <p>{error}</p>
        {isNonPlantError && (
          <p className="mt-2 text-sm">
            Please upload an image that clearly shows a plant. If you believe this is a mistake, 
            try taking a photo with better lighting or a clearer view of the plant.
          </p>
        )}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Plant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-grow">
          <form onSubmit={handleSubmit}>
            {renderErrorMessage()}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Plant Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Snake Plant, Monstera"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="species">
                Species/Variety
              </label>
              <input
                id="species"
                name="species"
                type="text"
                className="form-input"
                placeholder="e.g. Monstera Deliciosa"
                value={formData.species}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-input"
                placeholder="e.g. Living Room"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="waterFrequency">
                Watering Frequency
              </label>
              <input
                id="waterFrequency"
                name="waterFrequency"
                type="text"
                className="form-input"
                placeholder="e.g. Once a week"
                value={formData.waterFrequency}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sunlight">
                Sunlight Needs
              </label>
              <select
                id="sunlight"
                name="sunlight"
                className="form-input"
                value={formData.sunlight}
                onChange={handleChange}
              >
                <option value="low">Low Light</option>
                <option value="medium">Medium Light</option>
                <option value="high">Bright Light</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                Care Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                className="form-input"
                rows="3"
                placeholder="Any special care instructions..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Plant Image
              </label>
              
              {/* Hidden file input */}
              <input
                type="file"
                id="plantImageEdit"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              
              {/* Display current/new image preview */} 
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border mb-2 bg-gray-100">
                  <Image
                    key={imagePreview} // Add key to force re-render if preview source changes
                    src={imagePreview} // Can be blob or absolute URL
                    alt="Plant preview"
                    fill
                    className="object-contain p-1"
                  />
                  <button
                      type="button"
                      onClick={clearImage} // Use clearImage to remove/mark for deletion
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 text-xs"
                      aria-label="Remove image"
                  >
                      <FaTimes />
                  </button>
                  {/* Verification indicators */}
                   {isVerifyingImage && (
                      <div className="absolute bottom-2 right-2 bg-yellow-500 text-white p-1 rounded-full flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                        <span className="text-xs">Verifying...</span>
                      </div>
                    )}
                    {imageVerificationResult && !isVerifyingImage && (
                      <div className={`absolute bottom-2 right-2 ${imageVerificationResult.isPlant ? 'bg-green-500' : 'bg-red-500'} text-white p-1 rounded-full`}>
                        {imageVerificationResult.isPlant ? <FaCheck className="h-4 w-4" /> : <FaExclamationTriangle className="h-4 w-4" />}
                      </div>
                    )}
                </div>
              ) : (
                // Show upload prompt if no preview
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label
                    htmlFor="plantImageEdit"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2" />
                    <span className="text-gray-500">Click to upload plant image</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG or GIF (max 5MB)</span>
                  </label>
                </div>
              )}
              
              {/* Display plant detection confidence */} 
              {imageFile && imageVerificationResult && imageVerificationResult.isPlant && (
                <div className="mt-2 text-xs text-gray-600">
                  Detected a {imageVerificationResult.className} with {Math.round(imageVerificationResult.confidence * 100)}% confidence
                </div>
              )}
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
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Update Plant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlantForm; 