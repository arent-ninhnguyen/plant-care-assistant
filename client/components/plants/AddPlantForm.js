'use client';

import { useState } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import plantsApi from '../../utils/plantsApi';

const AddPlantForm = ({ onClose, onPlantAdded }) => {
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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e) => {
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
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };
  
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!formData.name) {
      setError('Plant name is required');
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
      
      // Add image if exists
      if (imageFile) {
        uploadData.append('plantImage', imageFile);
      }
      
      // Submit to API
      const response = await plantsApi.addPlant(uploadData);
      
      // Success
      if (onPlantAdded) {
        onPlantAdded(response.data);
      }
      
      // Close form
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error adding plant:', err);
      setError(err.response?.data?.error || 'Failed to add plant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Add New Plant</h2>
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
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
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
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="plantImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="plantImage"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2" />
                    <span className="text-gray-500">Click to upload plant image</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG or GIF (max 5MB)</span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Plant preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <FaTimes />
                  </button>
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
            {isSubmitting ? 'Saving...' : 'Save Plant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlantForm; 