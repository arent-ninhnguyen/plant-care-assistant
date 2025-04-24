'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import plantsApi from '../../utils/plantsApi'; // Assuming this path is correct
import EditPlantForm from '../../components/plants/EditPlantForm'; // Import EditPlantForm
import ReminderForm from '../../components/reminders/ReminderForm'; // Import ReminderForm
import { FaArrowLeft, FaEdit, FaTrashAlt, FaSun, FaTint, FaMapMarkerAlt, FaPlusCircle, FaBrain, FaCamera, FaPaperPlane, FaTimes } from 'react-icons/fa'; // Example icons
import { formatDistanceToNow, parseISO } from 'date-fns'; // For formatting dates
import { analyzePlantImage } from '../../utils/aiApi'; // Import AI API util
import ReactMarkdown from 'react-markdown'; // Import markdown renderer

// Helper to construct full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
  // Construct the correct URL including /api/uploads/
  return `${backendBaseUrl}/api/uploads/${imagePath}`;
};

let backendOrigin = 'http://localhost:5000'; 
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
    backendOrigin = apiUrl.origin; 
  } catch (e) {
    console.error('[PlantDetail] Invalid NEXT_PUBLIC_API_URL, using default origin.', e);
  }
}
const getAbsoluteImageUrl = (relativeUrl) => {
  if (!relativeUrl || typeof relativeUrl !== 'string' || !relativeUrl.startsWith('/')) {
    return null; 
  }
  return `${backendOrigin}${relativeUrl}`;
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
  const analysisFileInputRef = useRef(null); // Ref for AI file input

  // --- NEW: State for AI Analysis ---
  const [analysisImageFile, setAnalysisImageFile] = useState(null);
  const [analysisImagePreview, setAnalysisImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null); // To store the markdown string
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisLanguage, setAnalysisLanguage] = useState('English'); // <-- NEW: Language state

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

  // Effect to clean up analysis preview URL
  useEffect(() => {
    return () => {
      if (analysisImagePreview && analysisImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(analysisImagePreview);
      }
    };
  }, [analysisImagePreview]);

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

  // --- NEW: Handlers for AI Analysis ---
  const handleAnalysisImageChange = (e) => {
    const file = e.target.files[0];
    setAnalysisError(null); // Clear previous errors
    setAnalysisResult(null); // Clear previous results
    
    if (file && file.type.startsWith('image/')) {
      // Basic size check (optional, backend also checks)
      if (file.size > 10 * 1024 * 1024) { 
        setAnalysisError('Image too large (max 10MB).');
        setAnalysisImageFile(null);
        setAnalysisImagePreview(null);
        return;
      }
      setAnalysisImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnalysisImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAnalysisImageFile(null);
      setAnalysisImagePreview(null);
      if (file) { // Only show error if a file was selected but invalid
         setAnalysisError('Invalid file type. Please select an image.');
      }
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!analysisImageFile) {
      setAnalysisError('Please select an image first.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzePlantImage(analysisImageFile, analysisLanguage);
      console.log('AI Analysis Result:', result);
      setAnalysisResult(result.analysis); // Assuming backend returns { analysis: "markdown text" }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setAnalysisError(err.message || 'Failed to get analysis from AI.');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysisImage = () => {
     setAnalysisImageFile(null);
     setAnalysisImagePreview(null);
     setAnalysisResult(null); 
     setAnalysisError(null);
     // Reset the file input visually if needed
     if(analysisFileInputRef.current) {
        analysisFileInputRef.current.value = "";
     }
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
  const imageUrl = getAbsoluteImageUrl(plant.image);

  // Format dates nicely
  const lastWateredDate = plant.lastWatered ? parseISO(plant.lastWatered) : null;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-primary-600 hover:underline mb-6">
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          {imageUrl && (
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100">
              <Image 
                key={imageUrl} 
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

        {/* --- NEW: AI Analysis Section --- */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden p-6">
           <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
             <FaBrain className="mr-3 text-purple-600" /> AI Plant Status Check
           </h2>
           
           <div className="mb-4 flex flex-wrap items-center gap-4">
             <div>
               <label htmlFor="ai-image-upload" className="block text-sm font-medium text-gray-700 mb-1">
                 Upload Photo:
               </label>
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleAnalysisImageChange} 
                 ref={analysisFileInputRef} 
                 className="hidden" 
                 id="ai-image-upload" 
               />
               <button 
                  type="button" 
                  onClick={() => analysisFileInputRef.current?.click()} 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                 <FaCamera className="mr-2"/> Choose Image
               </button>
             </div>

             {analysisImagePreview && (
               <div className="relative h-16 w-16 border rounded">
                 <Image src={analysisImagePreview} alt="Analysis preview" fill className="object-contain"/>
                 <button 
                   type="button" 
                   onClick={clearAnalysisImage} 
                   className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 text-xs"
                   aria-label="Clear image"
                 >
                   <FaTimes />
                 </button>
               </div>
             )}

             {analysisImageFile && (
                <div className="ml-auto">
                 <label htmlFor="analysis-language" className="block text-sm font-medium text-gray-700 mb-1">
                    Language:
                  </label>
                 <select 
                    id="analysis-language"
                    value={analysisLanguage}
                    onChange={(e) => setAnalysisLanguage(e.target.value)}
                    disabled={isAnalyzing}
                    className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                   <option value="English">English</option>
                   <option value="Vietnamese">Vietnamese</option>
                   <option value="Spanish">Spanish</option>
                   <option value="Japanese">Japanese</option>
                   {/* Add more languages as needed */}
                 </select>
               </div>
             )}
           </div>

           {analysisImageFile && (
             <div className="mt-4">
                <button 
                  type="button" 
                  onClick={handleTriggerAnalysis} 
                  disabled={isAnalyzing} 
                  className="btn btn-primary w-full sm:w-auto flex items-center justify-center"
                >
                 {isAnalyzing ? (
                    <>
                       <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                       Analyzing...
                    </>
                 ) : (
                    <>
                       <FaPaperPlane className="mr-2"/> Analyze Image
                    </>
                 )}
               </button>
             </div>
           )}

           {analysisError && (
             <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
               <p><span className="font-bold">Error:</span> {analysisError}</p>
             </div>
           )}

           {analysisResult && (
              <div className="mt-6 pt-4 border-t">
                 <h3 className="text-xl font-semibold text-gray-700 mb-3">Analysis Results</h3>
                 <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                 </div>
             </div>
           )}
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