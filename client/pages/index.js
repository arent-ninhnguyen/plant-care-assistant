'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaLeaf, FaTint, FaSun, FaBell } from 'react-icons/fa';

export default function Home() {
  const [showDebugControl, setShowDebugControl] = useState(false);
  
  // Forcefully clear authentication state on page load
  useEffect(() => {
    async function clearAuth() {
      try {
        // Clear all localStorage
        localStorage.clear();
        
        // Clear all cookies client-side
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        console.log('All authentication state cleared on homepage load');
      } catch (err) {
        console.error('Error clearing auth state:', err);
      }
    }
    
    clearAuth();
    
    // Check for developer mode via keyboard shortcut
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D to toggle debug controls
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugControl(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Function to force clear auth state
  const handleForceClearAuth = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Hard reload the page
    window.location.reload();
  };

  return (
    <div>
      {/* Debug control - press Ctrl+Shift+D to show */}
      {showDebugControl && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 p-2 rounded shadow-md border border-red-300">
          <button 
            onClick={handleForceClearAuth}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Force Clear Auth
          </button>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-10 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Your Personal Plant Care Assistant
              </h1>
              <p className="text-xl mb-8">
                Track your plants, set watering reminders, and become a better plant parent
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/auth/register" className="btn bg-white text-primary-700 hover:bg-gray-100">
                  Get Started
                </Link>
                <Link href="/auth/login" className="btn bg-transparent border border-white hover:bg-white hover:bg-opacity-10">
                  Login
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md h-64 md:h-80">
                {/* Placeholder for hero image - replace with your actual plant image */}
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaLeaf className="text-6xl text-white opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="inline-block p-3 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaLeaf className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Plant Tracking</h3>
              <p className="text-gray-600">Keep a digital record of all your plants and their care requirements</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="inline-block p-3 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaTint className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Watering Schedule</h3>
              <p className="text-gray-600">Never forget to water your plants with custom watering schedules</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="inline-block p-3 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaSun className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Light Requirements</h3>
              <p className="text-gray-600">Track light needs for each plant to ensure optimal growth</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="inline-block p-3 rounded-full bg-primary-100 text-primary-600 mb-4">
                <FaBell className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Care Reminders</h3>
              <p className="text-gray-600">Get reminders for all plant care tasks including fertilizing and repotting</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow better plants?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of plant lovers who use Plant Care Assistant to keep their plants healthy and thriving.
          </p>
          <Link href="/auth/register" className="btn btn-primary text-lg px-8 py-3">
            Start Your Plant Journey
          </Link>
        </div>
      </section>
    </div>
  );
} 