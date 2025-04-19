'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { FaLeaf, FaPlus, FaBell, FaTint, FaCalendarAlt } from 'react-icons/fa';
import ClientOnly from '../components/common/ClientOnly';

// Components
import { PlantCard } from '../components/plants';
import { ReminderItem } from '../components/reminders';

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
        
        // Set up headers with the token if available
        const accessToken = effectiveUser?.accessToken;
        const config = accessToken ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        } : {};
        
        console.log('Using access token:', accessToken ? '(token available)' : '(no token)');
        
        // For testing, just set placeholder data instead of API calls
        setPlants([
          { _id: '1', name: 'Test Plant 1', species: 'Test Species', wateringFrequency: 7, lightRequirements: 'Medium' },
          { _id: '2', name: 'Test Plant 2', species: 'Test Species', wateringFrequency: 14, lightRequirements: 'Low' }
        ]);
        
        setReminders([
          { _id: '1', type: 'watering', dueDate: new Date(), completed: false, plantId: { name: 'Test Plant 1' } },
          { _id: '2', type: 'fertilizing', dueDate: new Date(), completed: true, plantId: { name: 'Test Plant 2' } }
        ]);
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

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {effectiveUser?.name || 'User'}
          </span>
          <Link href="/plants/add" className="btn btn-primary">
            <FaPlus className="mr-2" /> Add Plant
          </Link>
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
              <h3 className="text-lg font-semibold">Pending Tasks</h3>
              <p className="text-3xl font-bold">
                {reminders.filter(r => !r.completed).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Plants and Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plants Section */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FaLeaf className="mr-2 text-primary-500" /> My Plants
              </h2>
              <Link href="/plants" className="text-primary-600 hover:text-primary-800 text-sm">
                View All
              </Link>
            </div>
            
            {plants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't added any plants yet.</p>
                <Link href="/plants/add" className="btn btn-primary">
                  <FaPlus className="mr-2" /> Add Your First Plant
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plants.slice(0, 4).map(plant => (
                  <div key={plant._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg">{plant.name}</h3>
                    <p className="text-gray-600 text-sm">{plant.species}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Water every {plant.wateringFrequency} days
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {plant.lightRequirements} light
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Reminders Section */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FaCalendarAlt className="mr-2 text-primary-500" /> Upcoming Tasks
              </h2>
              <Link href="/reminders" className="text-primary-600 hover:text-primary-800 text-sm">
                View All
              </Link>
            </div>
            
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.filter(r => !r.completed).slice(0, 5).map(reminder => (
                  <div key={reminder._id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}</h4>
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                        {new Date(reminder.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {reminder.plantId?.name || 'Unknown plant'}
                    </p>
                    {reminder.notes && (
                      <p className="text-xs text-gray-500 mt-1">{reminder.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 