import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  FaUserTie, FaChild, FaUsers, FaCalendarAlt, FaClipboardList, 
  FaEnvelope, FaSignOutAlt, FaBars, FaTimes, FaUserCircle, FaExclamationCircle, FaGift 
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const ParentNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const navItems = [
    { path: '/parent/dashboard', icon: <FaUserTie />, label: 'Dashboard' },
    // { path: '/parent/children', icon: <FaChild />, label: 'My Children' },
    // { path: '/parent/chat', icon: <FaEnvelope />, label: 'Messages' },
    { path: '/parent/forms/pending', icon: <FaClipboardList />, label: 'Forms' },
    // { path: '/parent/teachers', icon: <FaUsers />, label: 'Teachers' },
    { path: '/parent/profile', icon: <FaUserCircle />, label: 'Profile' },
    { path: '/parent/donations', icon: <FaGift />, label: 'Donations' },
    // { path: '/parent/support/complaint', icon: <FaExclamationCircle />, label: 'Raise Complaint' }
  ];
  
  return (
    <nav className="bg-primary-600 text-white shadow-md">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden p-4 flex items-center justify-between">
        <div className="flex items-center">
          <FaUserTie className="mr-2 h-6 w-6" />
          <h1 className="text-xl font-bold">Parent Portal</h1>
        </div>
        <button onClick={toggleMobileMenu} className="text-white">
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
      
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center justify-between p-4 container mx-auto">
        <div className="flex items-center">
          <FaUserTie className="mr-2 h-6 w-6 text-white" />
          <h1 className="text-xl font-bold">Parent Portal</h1>
        </div>
        
        <div className="flex space-x-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center hover:text-primary-200 transition-colors ${
                  isActive ? 'text-primary-200 font-semibold' : 'text-white'
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center  text-red-600 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white shadow-lg transition-all`}>
        <div className="container mx-auto">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center py-3 px-6 hover:bg-gray-100 transition-colors ${
                      isActive ? 'text-primary-600 font-medium' : 'text-gray-800'
                    }`
                  }
                >
                  <span className="mr-3 text-primary-500">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center py-3 px-6  text-red-600 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span className="mr-3"><FaSignOutAlt /></span>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default ParentNavbar;
