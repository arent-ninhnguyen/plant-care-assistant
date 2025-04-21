'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { FaLeaf, FaPlus, FaBell, FaTint, FaCalendarAlt } from 'react-icons/fa';
import ClientOnly from '../components/common/ClientOnly';

// Components
import PlantCard from '../components/plants/PlantCard';
import AddPlantForm from '../components/plants/AddPlantForm';
import EditPlantForm from '../components/plants/EditPlantForm';
import { ReminderItem } from '../components/reminders';
import plantsApi from '../utils/plantsApi';

export default function Dashboard() {
  return (
    <ClientOnly>
      <DashboardContent />
    </ClientOnly>
  );
}

// Helper function to create a fallback user object if needed
const createFallbackUser = () => {
  return {
    id: 'temp-user-id',
    name: 'Guest User',
    email: 'guest@example.com',
    accessToken: `temp-token-${Math.random().toString(36).substring(2)}`
  };
};

// Separate component to avoid hydration errors
function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');
  const [authDebug, setAuthDebug] = useState({});
  const [manualUser, setManualUser] = useState(null);
  const [directSession, setDirectSession] = useState(null);
  const [showAddPlantForm, setShowAddPlantForm] = useState(false);
  const [showEditPlantForm, setShowEditPlantForm] = useState(false);
  const [plantToEdit, setPlantToEdit] = useState(null);
  
  const router = useRouter();
  const { data: session, status } = useSession({
    required: false  // Changed to false so we can handle authentication ourselves
  });

  // Directly fetch session from API endpoint
  useEffect(() => {
    const fetchDirectSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          console.log('Direct session API response:', data);
          setDirectSession(data);
          
          // If we got a valid user, use it
          if (data.user) {
            setManualUser(data.user);
          }
        } else {
          console.error('Error fetching direct session:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch direct session:', error);
      }
    };
    
    fetchDirectSession();
  }, []);

  // Try to recover session from localStorage if no valid user is found
  useEffect(() => {
    // Only try localStorage if no other user data is available
    if (!session?.user && !directSession?.user && !manualUser) {
      console.log('No user data from any source, checking localStorage');
      
      // Try to get user from localStorage
      try {
        const storedUser = localStorage.getItem('plantCareUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Recovered user from localStorage:', parsedUser);
          setManualUser(parsedUser);
        } else {
          console.log('No stored user found, using fallback');
          setManualUser(createFallbackUser());
        }
      } catch (e) {
        console.error('Error recovering user:', e);
        setManualUser(createFallbackUser());
      }
    }
  }, [session, directSession, manualUser]);

  // Add debugging for session status
  useEffect(() => {
    console.log('NextAuth Session status:', status);
    console.log('NextAuth Session data:', session);
    console.log('Direct session data:', directSession);
    console.log('Manual user:', manualUser);
    
    // Debug token information
    try {
      const storedUser = localStorage.getItem('plantCareUser');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const directToken = localStorage.getItem('accessToken');
      
      console.log('Token debug info:', {
        hasAccessToken: !!directToken,
        accessTokenLength: directToken ? directToken.length : 0,
        hasStoredUser: !!storedUser,
        hasUserAccessToken: parsedUser && !!parsedUser.accessToken,
        userAccessTokenLength: parsedUser && parsedUser.accessToken ? parsedUser.accessToken.length : 0
      });
    } catch (err) {
      console.error('Error debugging tokens:', err);
    }
    
    setAuthDebug({ 
      nextAuthStatus: status,
      nextAuthSession: session,
      directSession,
      manualUser 
    });
  }, [status, session, directSession, manualUser]);

  // Handle session recovery failure
  const handleRetryLogin = () => {
    // Clear any stored data
    localStorage.removeItem('plantCareUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('next-auth.session-token');
    
    // Sign out from NextAuth
    signOut({ redirect: false }).then(() => {
      console.log('Signed out, redirecting to login');
      router.push('/auth/login');
    });
  };

  // Fetch plants and reminders when session is available
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch data');
        
        // Use any available user data
        const effectiveUser = session?.user || directSession?.user || manualUser;
        
        // Check if we have a user object to use
        if (!effectiveUser) {
          console.warn('No effective user available yet');
          // Don't set error yet, we might still be waiting for user data
          return;
        }
        
        // Now we have a user, stop loading
        setLoading(false);
        
        try {
          // Fetch real plant data from API
          const plantsResponse = await plantsApi.getPlants();
          setPlants(plantsResponse.data);
          console.log('Plants loaded:', plantsResponse.data);
          
          // For now, just use sample reminders
          setReminders([
            { _id: '1', type: 'watering', dueDate: new Date(), completed: false, plantId: { name: 'Test Plant 1' } },
            { _id: '2', type: 'fertilizing', dueDate: new Date(), completed: true, plantId: { name: 'Test Plant 2' } }
          ]);
        } catch (apiError) {
          console.error('API call error:', apiError);
          // If API calls fail, fall back to sample data for testing
          setPlants([
            { _id: '1', name: 'Test Plant 1', species: 'Test Species', waterFrequency: '7 days', sunlight: 'medium' },
            { _id: '2', name: 'Test Plant 2', species: 'Test Species', waterFrequency: '14 days', sunlight: 'low' }
          ]);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load your data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [status, session, directSession, manualUser]);
  
  // Get effective user from all sources
  const effectiveUser = session?.user || directSession?.user || manualUser;
  
  // Show loading indicator while fetching initial data
  if (loading && !effectiveUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If we determined we're not authenticated after checking all options
  if (status === 'unauthenticated' && !directSession?.user && !manualUser) {
    console.log('Truly unauthenticated, redirecting to login');
    router.push('/auth/login');
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        You are not logged in. Redirecting to login page...
      </div>
    );
  }
  
  // If we have an error
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <div className="mt-4">
          <h3 className="font-bold">Debug Info:</h3>
          <pre className="bg-gray-100 p-2 mt-1 text-xs overflow-auto">
            {JSON.stringify(authDebug, null, 2)}
          </pre>
          <div className="mt-4">
            <button 
              onClick={handleRetryLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle adding a new plant
  const handleAddPlant = (newPlant) => {
    setPlants([...plants, newPlant]);
    setShowAddPlantForm(false);
  };
  
  // Handle plant edit
  const handleEditPlant = (plant) => {
    setPlantToEdit(plant);
    setShowEditPlantForm(true);
  };
  
  // Handle updating a plant
  const handlePlantUpdated = (updatedPlant) => {
    // Update the plants array with the updated plant
    setPlants(plants.map(p => 
      p._id === updatedPlant._id ? updatedPlant : p
    ));
    
    // Close the edit form
    setShowEditPlantForm(false);
    setPlantToEdit(null);
  };
  
  // Handle plant delete
  const handleDeletePlant = async (plantId) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      try {
        await plantsApi.deletePlant(plantId);
        setPlants(plants.filter(plant => plant._id !== plantId));
      } catch (error) {
        console.error('Error deleting plant:', error);
        alert('Failed to delete plant. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {effectiveUser?.name || 'User'}
          </span>
          <button 
            onClick={() => setShowAddPlantForm(true)} 
            className="btn btn-primary flex items-center"
          >
            <FaPlus className="mr-2" /> Add Plant
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FaLeaf className="text-primary-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Total Plants</h3>
              <p className="text-3xl font-bold">{plants.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FaTint className="text-blue-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Plants to Water</h3>
              <p className="text-3xl font-bold">
                {reminders.filter(r => r.type === 'watering' && !r.completed).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FaBell className="text-yellow-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Active Reminders</h3>
              <p className="text-3xl font-bold">{reminders.filter(r => !r.completed).length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Plants Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">My Plants</h2>
        
        {plants.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
            <FaLeaf className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No plants yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first plant to track</p>
            <button 
              onClick={() => setShowAddPlantForm(true)}
              className="btn btn-primary"
            >
              <FaPlus className="mr-2" /> Add Your First Plant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plants.map(plant => (
              <PlantCard 
                key={plant._id} 
                plant={plant} 
                onEdit={handleEditPlant}
                onDelete={handleDeletePlant}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Reminders Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Recent Reminders</h2>
          <Link href="/dashboard/reminders" className="text-primary-600 hover:underline flex items-center">
            View All <FaCalendarAlt className="ml-1" />
          </Link>
        </div>
        
        {reminders.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600">No reminders yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {reminders.slice(0, 3).map(reminder => (
              <div key={reminder._id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{reminder.plantId.name}</p>
                  <p className="text-sm text-gray-600">
                    {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)} due {' '}
                    {new Date(reminder.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  {reminder.completed ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Completed
                    </span>
                  ) : (
                    <button className="btn btn-primary text-sm py-1">
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Plant Modal */}
      {showAddPlantForm && (
        <AddPlantForm 
          onClose={() => setShowAddPlantForm(false)} 
          onPlantAdded={handleAddPlant}
        />
      )}
      
      {/* Edit Plant Modal */}
      {showEditPlantForm && plantToEdit && (
        <EditPlantForm 
          plant={plantToEdit}
          onClose={() => {
            setShowEditPlantForm(false);
            setPlantToEdit(null);
          }} 
          onPlantUpdated={handlePlantUpdated}
        />
      )}
    </div>
  );
} 