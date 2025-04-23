'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import plantsApi from '../../utils/plantsApi'; // Assuming this path is correct
import EditPlantForm from '../../components/plants/EditPlantForm'; // Import EditPlantForm
import ReminderForm from '../../components/reminders/ReminderForm'; // Import ReminderForm
import { FaArrowLeft, FaEdit, FaTrashAlt, FaSun, FaTint, FaMapMarkerAlt, FaPlusCircle } from 'react-icons/fa'; // Example icons
import { formatDistanceToNow, parseISO } from 'date-fns'; // For formatting dates

// Helper to construct full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
  // Construct the correct URL including /api/uploads/
  return `${backendBaseUrl}/api/uploads/${imagePath}`;
};

const PlantDetailPage = () => {
  const router = useRouter();
  const { id: plantId } = router.query; // Get plant ID from URL query
  const { data: session, status } = useSession();
  
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false); // State for edit modal
  const [showAddReminderForm, setShowAddReminderForm] = useState(false); // State for reminder modal

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }

    // Fetch plant data only if authenticated and plantId is available
    if (status === 'authenticated' && plantId) {
      setLoading(true);
      setError('');
      plantsApi.getPlant(plantId)
        .then(response => {
          setPlant(response.data);
          setError('');
        })
        .catch(err => {
          console.error('Error fetching plant details:', err);
          setError(err.response?.data?.error || 'Failed to load plant details.');
          setPlant(null); // Clear plant data on error
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [plantId, status, router]); // Dependencies for the effect

  // --- Handlers for Edit/Delete --- 
  const handleEditClick = () => {
    if (plant) {
      setShowEditForm(true);
    }
  };

  const handleDeleteClick = async () => {
    if (plant && window.confirm(`Are you sure you want to delete ${plant.name}?`)) {
      try {
        setLoading(true); // Indicate loading during delete
        await plantsApi.deletePlant(plant._id);
        console.log('Plant deleted successfully');
        router.push('/dashboard'); // Navigate back to dashboard after delete
      } catch (err) {
        console.error('Error deleting plant:', err);
        setError(err.response?.data?.error || 'Failed to delete plant.');
        setLoading(false); // Stop loading on error
      }
    }
  };

  const handlePlantUpdated = (updatedPlantData) => {
    // Update the local plant state with the new data from the form
    setPlant(prevPlant => ({ ...prevPlant, ...updatedPlantData }));
    setShowEditForm(false); // Close the modal
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
  };

  // --- Handlers for Add Reminder --- 
  const handleAddReminderClick = () => {
    setShowAddReminderForm(true);
  };

  const handleCloseReminderForm = () => {
    setShowAddReminderForm(false);
  };

  const handleReminderAdded = (newReminder) => {
    console.log('New reminder added:', newReminder);
    // Optionally, update a list of reminders displayed on this page if needed
    setShowAddReminderForm(false); // Close the form
    // Maybe show a success message
  };

  // Show loading state
  if (loading || status === 'loading') {
    return <div className="container mx-auto px-4 py-8 text-center">Loading plant details...</div>;
  }

  // Show error message
  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-600">Error: {error}</div>;
  }

  // Show message if plant not found (and not loading/error)
  if (!plant) {
    return <div className="container mx-auto px-4 py-8 text-center">Plant not found.</div>;
  }

  // Construct image URL
  const imageUrl = getImageUrl(plant.image);

  // Format dates nicely
  const lastWateredDate = plant.lastWatered ? parseISO(plant.lastWatered) : null;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-primary-600 hover:underline mb-6">
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {imageUrl && (
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100">
              <Image 
                src={imageUrl} 
                alt={plant.name || 'Plant image'}
                fill
                className="object-contain p-1"
                priority
                onError={() => console.error('Detail page image failed to load:', imageUrl)}
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">{plant.name}</h1>
                <p className="text-lg text-gray-600 italic">{plant.species}</p>
              </div>
              <div className="flex space-x-2">
                {/* Add Reminder Button */}
                <button 
                  onClick={handleAddReminderClick} 
                  className="p-2 text-gray-500 hover:text-green-600" 
                  title="Add Reminder"
                  disabled={loading}
                >
                  <FaPlusCircle />
                </button>
                {/* Edit Button */}
                <button 
                  onClick={handleEditClick} 
                  className="p-2 text-gray-500 hover:text-blue-600" 
                  title="Edit Plant"
                  disabled={loading} // Disable while loading/deleting
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={handleDeleteClick} 
                  className="p-2 text-gray-500 hover:text-red-600" 
                  title="Delete Plant"
                  disabled={loading} // Disable while loading/deleting
                >
                  <FaTrashAlt />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Details */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-3 text-gray-500" />
                  <span className="text-gray-700">Location: {plant.location || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <FaSun className="mr-3 text-gray-500" />
                  <span className="text-gray-700">Sunlight: {plant.sunlight || 'N/A'}</span>
                </div>
              </div>
              {/* Right Column: Watering */}
              <div className="space-y-3">
                 <div className="flex items-center">
                  <FaTint className="mr-3 text-gray-500" />
                  <span className="text-gray-700">Water every: {plant.waterFrequency || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <FaTint className="mr-3 text-gray-500" />
                  <span className="text-gray-700">Last watered: {lastWateredDate ? `${formatDistanceToNow(lastWateredDate)} ago` : 'Never'}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {plant.notes && (
              <div className="mt-6 pt-4 border-t">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Notes</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{plant.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Conditionally render Edit Form Modal --- */}
      {showEditForm && plant && (
        <EditPlantForm
          plant={plant}
          onPlantUpdated={handlePlantUpdated}
          onClose={handleCloseEditForm}
        />
      )}

      {/* --- Conditionally render Add Reminder Form Modal --- */}
      {showAddReminderForm && plant && (
        <ReminderForm 
          plantId={plant._id}
          plantName={plant.name}
          onClose={handleCloseReminderForm}
          onReminderAdded={handleReminderAdded}
        />
      )}
    </>
  );
};

export default PlantDetailPage; 