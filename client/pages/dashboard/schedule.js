'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { parseISO } from 'date-fns';
import remindersApi from '../../utils/remindersApi'; // Adjust path if needed
import Link from 'next/link';
import { FaCalendarAlt } from 'react-icons/fa';

// Setup the localizer by providing the required date-fns functions
const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CareSchedulePage = () => {
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
      setReminders(response.data);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      setError("Failed to load reminder data.");
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

  // Transform reminder data into events for the calendar
  const calendarEvents = useMemo(() => {
    return reminders.map(reminder => {
      const dueDate = parseISO(reminder.dueDate);
      return {
        id: reminder._id,
        title: `${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)} - ${reminder.plantId?.name || 'Unknown'}`,
        start: dueDate,
        end: dueDate, // For single-day events, start and end are the same
        allDay: true, // Treat reminders as all-day events
        resource: reminder, // Store original reminder data if needed later
        isCompleted: reminder.completed // Custom prop for styling
      };
    });
  }, [reminders]);

  // Custom styling for events
  const eventStyleGetter = (event, start, end, isSelected) => {
    let style = {
      backgroundColor: '#3498db', // Default blue
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    if (event.isCompleted) {
      style.backgroundColor = '#2ecc71'; // Green for completed
      style.textDecoration = 'line-through';
      style.opacity = 0.6;
    }
    // Add more conditions for different reminder types if desired
    // else if (event.resource.type === 'watering') { style.backgroundColor = '#3498db'; }
    // else if (event.resource.type === 'fertilizing') { style.backgroundColor = '#f1c40f'; }

    return {
      style: style
    };
  };

  if (status === 'loading' || loading) {
    return <div className="p-6 text-center">Loading schedule...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-6 flex items-center">
        <FaCalendarAlt className="mr-3 text-primary-600" /> Care Schedule
      </h1>
      <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter} // Apply custom styles
          // Optional: Add navigation handlers or view change handlers if needed
          // onSelectEvent={event => alert(event.title)} 
        />
      </div>
    </div>
  );
};

export default CareSchedulePage; 