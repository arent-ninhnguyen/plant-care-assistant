'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaHome, 
  FaSeedling, 
  FaBell, 
  FaCalendarAlt, 
  FaUser, 
  FaCog, 
  FaQuestionCircle,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const Sidebar = ({ collapsed = false, onToggle }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check viewport size
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkViewport();
    
    // Update on window resize
    window.addEventListener('resize', checkViewport);
    
    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else if (onToggle) {
      onToggle();
    }
  };

  // Links with icons
  const menuItems = [
    { icon: <FaSeedling className="sidebar-icon" />, text: 'My Plants', href: '/dashboard' },
    { icon: <FaBell className="sidebar-icon" />, text: 'Reminders', href: '/dashboard/reminders' },
    { icon: <FaCalendarAlt className="sidebar-icon" />, text: 'Care Schedule', href: '/dashboard/schedule' },
    { icon: <FaUser className="sidebar-icon" />, text: 'Profile', href: '/dashboard/profile' },
    { icon: <FaCog className="sidebar-icon" />, text: 'Settings', href: '/dashboard/settings' },
    { icon: <FaQuestionCircle className="sidebar-icon" />, text: 'Help', href: '/help' },
  ];

  // Mobile sidebar toggle button
  const MobileToggle = () => (
    <button 
      className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary-600 text-white shadow-lg"
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      {mobileOpen ? <FaTimes /> : <FaBars />}
    </button>
  );

  // Desktop collapsed sidebar
  if (collapsed && !isMobile) {
    return (
      <>
        <div className="sidebar sidebar-collapsed">
          <div className="flex flex-col items-center pt-16">
            <button 
              onClick={toggleSidebar} 
              className="p-2 mb-4 rounded hover:bg-gray-700"
              aria-label="Expand sidebar"
            >
              <FaBars />
            </button>
            
            {menuItems.map((item, index) => (
              <Link 
                href={item.href} 
                key={index}
                className={`p-3 my-1 rounded hover:bg-gray-700 ${
                  router.pathname === item.href ? 'sidebar-link-active' : ''
                }`}
                title={item.text}
              >
                {item.icon}
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileToggle />
      
      <div className={`sidebar sidebar-expanded ${
        isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : ''
      }`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Plant Care</h2>
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded hover:bg-gray-700"
              aria-label="Collapse sidebar"
            >
              {isMobile ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
        
        <nav className="mt-6">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.href}
                  className={`sidebar-link ${
                    router.pathname === item.href ? 'sidebar-link-active' : ''
                  }`}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar; 