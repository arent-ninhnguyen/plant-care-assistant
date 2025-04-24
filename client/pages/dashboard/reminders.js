'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import remindersApi from '../../utils/remindersApi'; // Adjust path if needed
import { format, parseISO, compareAsc, differenceInHours } from 'date-fns';
import { FaBell, FaCheckCircle, FaTimesCircle, FaEdit, FaTrashAlt, FaCalendarDay } from 'react-icons/fa';

// Reminder Row Component (for better structure)
const ReminderRow = ({ reminder, onToggleComplete, onDelete }) => {
  const isCompleted = reminder.completed;
  const dueDate = parseISO(reminder.dueDate);

  // --- Add Highlighting Logic --- 
  let isDueSoonOrOverdue = false;
  if (!isCompleted && reminder.dueDate) {
    try {
      const hoursDifference = differenceInHours(dueDate, new Date());
      if (hoursDifference <= 24) {
        isDueSoonOrOverdue = true;
      }
    } catch (e) {
      console.error("Error checking due date for highlight in ReminderRow:", reminder, e);
    }
  }
  // --- End Highlighting Logic ---

  // Define base classes and conditional classes
  const baseClasses = "hover:bg-gray-50";
  const completedClasses = "bg-green-50 text-gray-500 line-through";
  const dueSoonClasses = "bg-yellow-50";

  return (
    <tr className={`
      ${baseClasses} 
      ${isCompleted ? completedClasses : (isDueSoonOrOverdue ? dueSoonClasses : 'bg-white')}
    `}>
      <td className="px-4 py-3 whitespace-nowrap">
        <Link href={`/plants/${reminder.plantId?._id}`} className="text-primary-600 hover:underline font-medium">
          {reminder.plantId?.name || 'Unknown Plant'}
        </Link>
      </td>
      <td className="px-4 py-3 whitespace-nowrap capitalize">
        {reminder.type}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {format(dueDate, 'PP')} {/* e.g., Jul 21, 2024 */}
      </td>
      <td className="px-4 py-3">
        {reminder.notes || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        {isCompleted ? (
          <FaCheckCircle className="text-green-500 mx-auto" title="Completed" />
        ) : (
          <FaTimesCircle className="text-gray-400 mx-auto" title="Pending" />
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
        <button
          onClick={() => onToggleComplete(reminder._id, !isCompleted)} // Pass new status
          className={`btn btn-sm ${isCompleted ? 'btn-outline-secondary' : 'btn-outline-success'}`}
          title={isCompleted ? 'Mark as Pending' : 'Mark as Complete'}
        >
          {isCompleted ? 'Undo' : 'Complete'}
        </button>
        {/* Optional Edit Button - Add handler later if needed */}
        {/* <button className="text-blue-500 hover:text-blue-700" title="Edit"><FaEdit /></button> */}
        <button
          onClick={() => onDelete(reminder._id, reminder.plantId?.name)}
          className="text-red-500 hover:text-red-700" 
          title="Delete"
        >
          <FaTrashAlt />
        </button>
      </td>
    </tr>
  );
};

// Main Page Component
const RemindersPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReminders = useCallback(async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError('');
    try {
      const response = await remindersApi.getReminders();
      // Sort by due date initially
      const sorted = response.data.sort((a, b) => compareAsc(parseISO(a.dueDate), parseISO(b.dueDate)));
      setReminders(sorted);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      setError("Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReminders();
    } else if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router, fetchReminders]);

  const handleToggleComplete = async (id, newStatus) => {
    const originalReminders = [...reminders];
    // Optimistic update
    setReminders(prev => prev.map(r => r._id === id ? { ...r, completed: newStatus } : r));

    try {
      // If marking complete, use specific endpoint, otherwise use general update
      if (newStatus === true) {
         await remindersApi.markComplete(id);
      } else {
         await remindersApi.updateReminder(id, { completed: false });
      }
    } catch (err) {
      console.error("Error updating reminder status:", err);
      setError("Failed to update reminder status.");
      setReminders(originalReminders); // Revert on error
    }
  };

  const handleDeleteReminder = async (id, plantName) => {
    if (window.confirm(`Are you sure you want to delete this reminder for ${plantName || 'this plant'}?`)) {
      const originalReminders = [...reminders];
      // Optimistic update
      setReminders(prev => prev.filter(r => r._id !== id));
      try {
        await remindersApi.deleteReminder(id);
      } catch (err) {
        console.error("Error deleting reminder:", err);
        setError("Failed to delete reminder.");
        setReminders(originalReminders); // Revert on error
      }
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-6 text-center">Loading reminders...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-6 flex items-center">
        <FaBell className="mr-3 text-primary-600" /> All Reminders
      </h1>

      {reminders.length === 0 ? (
        <div className="text-center text-gray-500 bg-gray-50 p-8 rounded-lg border">
          You have no reminders scheduled.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reminders.map((reminder) => (
                <ReminderRow 
                  key={reminder._id} 
                  reminder={reminder} 
                  onToggleComplete={handleToggleComplete} 
                  onDelete={handleDeleteReminder} 
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RemindersPage; 