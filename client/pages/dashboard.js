'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { FaLeaf, FaPlus, FaBell, FaTint, FaCalendarAlt, FaCheck } from 'react-icons/fa';
import { format, parseISO, differenceInHours, isFuture } from 'date-fns';
import ClientOnly from '../components/common/ClientOnly';
import { toast } from 'react-toastify';

// Components
import PlantCard from '../components/plants/PlantCard';
import AddPlantForm from '../components/plants/AddPlantForm';
import EditPlantForm from '../components/plants/EditPlantForm';
import { ReminderItem } from '../components/reminders';
import plantsApi from '../utils/plantsApi';
import remindersApi from '../utils/remindersApi';

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
  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') {
      console.warn('User not authenticated, skipping data fetch');
      setLoading(false); // Stop loading if not authenticated
      return; 
    }
    
    setLoading(true);
    setError('');
    try {
      console.log('Authenticated, fetching plants and reminders...');
      // Fetch plants and reminders in parallel
      const [plantsResponse, remindersResponse] = await Promise.all([
        plantsApi.getPlants(),
        remindersApi.getReminders()
      ]);

      setPlants(plantsResponse.data);
      setReminders(remindersResponse.data); 
      console.log('Plants loaded:', plantsResponse.data.length);
      console.log('Reminders loaded:', remindersResponse.data.length);

    } catch (apiError) {
      console.error('API call error during initial fetch:', apiError);
      setError('Failed to load dashboard data. Please try refreshing.');
      // Optionally set fallback data or clear existing data
      setPlants([]);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData(); // Fetch data when component mounts or status changes
  }, [fetchData]);

  // --- NEW: Effect to check for upcoming reminders --- 
  useEffect(() => {
    console.log('[Reminder Check Effect] Running. Current reminders state:', reminders);

    if (reminders && reminders.length > 0) {
      const now = new Date();
      let notificationShown = false; // Flag to show only one summary toast for now
      
      console.log('[Reminder Check] Checking reminders for due dates...'); // Added log

      reminders.forEach(reminder => {
        console.log('  [Reminder Check Loop] Processing reminder:', reminder); // <-- Log the whole reminder object
        try {
          if (reminder.dueDate) {
            const dueDateObj = parseISO(reminder.dueDate);
            const hoursDifference = differenceInHours(dueDateObj, now);
            console.log(`  - Checking: ${reminder.plantName} - ${reminder.type}, Due: ${reminder.dueDate}, Hours Diff: ${hoursDifference}`);

            // --- MODIFIED CONDITION --- 
            // Check if due date is within 24 hours (past or future)
            if (hoursDifference <= 24) { 
              // Also check if it's *not* already marked complete in the current state
              if (!reminder.completed) {
                 console.log(`    -> Due Soon or Overdue: ${reminder.plantName} - ${reminder.type}`);
                 // Show a single summary toast for now to avoid spamming
                 if (!notificationShown) {
                    toast.warn(`You have reminders that are overdue or due within 24 hours!`); // Updated message
                    notificationShown = true;
                 }
              }
            } else {
              // Optional: Log why it didn't trigger for debugging
              // console.log(`    -> Not triggering: Hours diff > 24`);
            }
          } else {
             // Optional: Log reminders without a nextReminderDate
             // console.log(`  - Skipping: ${reminder.plantName} - ${reminder.type} (no nextReminderDate)`);
          }
        } catch (e) {
          console.error("Error processing reminder date:", reminder, e);
        }
      });
    }
  }, [reminders]); // Run this effect when the reminders state changes

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
    if (window.confirm('Are you sure you want to delete this plant and its reminders?')) {
      try {
        await plantsApi.deletePlant(plantId);
        setPlants(plants.filter(plant => plant._id !== plantId));
        setReminders(reminders.filter(r => r.plantId._id !== plantId));
      } catch (error) {
        console.error('Error deleting plant:', error);
        alert('Failed to delete plant. Please try again.');
      }
    }
  };

  // Handle marking a reminder complete
  const handleMarkComplete = async (reminderId) => {
    console.log('Marking reminder complete:', reminderId);
    try {
      // Optimistic UI update: Mark as complete immediately
      setReminders(prevReminders => 
        prevReminders.map(r => r._id === reminderId ? { ...r, completed: true } : r)
      );

      // Call the API
      await remindersApi.markComplete(reminderId);
      console.log('Reminder marked complete successfully on backend');
      // Optionally refetch reminders or rely on optimistic update
      // fetchData(); // Uncomment to refetch all data

    } catch (err) {
      console.error('Failed to mark reminder complete:', err);
      setError('Failed to update reminder status.');
      // Revert optimistic update on error
      setReminders(prevReminders =>
        prevReminders.map(r => r._id === reminderId ? { ...r, completed: false } : r)
      );
    }
  };

  // Filter for active reminders (not completed)
  const activeReminders = reminders.filter(r => !r.completed);
  // Sort reminders by due date (soonest first)
  const sortedReminders = [...activeReminders].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

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
              <p className="text-3xl font-bold">{activeReminders.length}</p>
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
            {sortedReminders.slice(0, 5).map(reminder => {
              // --- Add Highlighting Logic Here ---
              let isDueSoonOrOverdue = false;
              try {
                if (reminder.dueDate && !reminder.completed) {
                  const dueDateObj = parseISO(reminder.dueDate);
                  const hoursDifference = differenceInHours(dueDateObj, new Date());
                  if (hoursDifference <= 24) {
                    isDueSoonOrOverdue = true;
                  }
                }
              } catch (e) {
                console.error("Error checking due date for highlight:", reminder, e);
              }
              // --- End Highlighting Logic ---
              
              return (
              <div 
                key={reminder._id} 
                className={`p-4 flex justify-between items-center ${isDueSoonOrOverdue ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
              >
                <div>
                  {/* Ensure plantId exists before accessing name */}
                  <p className="font-medium">{reminder.plantId?.name || 'Unknown Plant'}</p>
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
                    <button 
                      onClick={() => handleMarkComplete(reminder._id)}
                      className="btn btn-primary text-sm py-1"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
             );
            })}
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