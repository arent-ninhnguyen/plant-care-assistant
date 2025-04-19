import { createContext, useContext, useState } from 'react';

// Create the context
const AppContext = createContext();

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Provider component
export function AppProvider({ children }) {
  // Define shared state here
  const [plants, setPlants] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Values to be provided to consumers
  const value = {
    plants,
    setPlants,
    reminders,
    setReminders,
    loading,
    setLoading,
    error,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppContext; 