import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  FaUserTie, FaBook, FaUsers, FaCalendarAlt, FaChalkboardTeacher, 
  FaSignOutAlt, FaClipboardList, FaBars, FaTimes, FaChartBar, FaExclamationCircle 
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../ui/Footer';

const TeacherLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const navItems = [
    { path: '/teacher/dashboard', icon: <FaUserTie />, label: 'Dashboard' },
    { path: '/teacher/classes', icon: <FaChalkboardTeacher />, label: 'My Classes' },
    { path: '/teacher/attendance', icon: <FaCalendarAlt />, label: 'Attendance' },
    { path: '/teacher/marksheets', icon: <FaBook />, label: 'Marksheets' },
    { path: '/teacher/forms', icon: <FaClipboardList />, label: 'Forms' },
    { path: '/teacher/chat', icon: <FaUsers />, label: 'Parent Chat' },
    { path: '/teacher/analytics', icon: <FaChartBar />, label: 'Analytics' },
    // { path: '/teacher/support/complaint', icon: <FaExclamationCircle />, label: 'Raise Complaint' }
  ];
  
  return (
    <div className="min-h-screen bg-sand flex flex-col">
      {/* Top Navigation */}
      <div className="bg-primary-600 text-white">
        {/* Mobile Menu Toggle */}
        <div className="md:hidden p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FaChalkboardTeacher className="mr-2 h-6 w-6" />
            <h1 className="text-xl font-bold">Teacher Portal</h1>
          </div>
          <button onClick={toggleMobileMenu} className="text-white">
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center justify-between p-4 container mx-auto">
          <div className="flex items-center">
            <FaChalkboardTeacher className="mr-2 h-6 w-6 text-white" />
            <h1 className="text-xl font-bold">Teacher Portal</h1>
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
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center text-white hover:text-primary-200 transition-colors"
          >
            <FaSignOutAlt className="mr-1" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      <div 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:hidden bg-white shadow-md`}
      >
        <nav className="py-2">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center py-3 px-6 hover:bg-gray-100 transition-colors ${
                      isActive ? 'text-primary-600 font-semibold bg-gray-50' : 'text-gray-800'
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
              className="w-full flex items-center py-3 px-6 text-yellow-900 bg-orange-400  hover:bg-yellow-700 transition-colors"
            >
              <span className="mr-3"><FaSignOutAlt /></span>
              Logout
            </button>

            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow p-6 md:p-8 overflow-auto">
        <Outlet />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TeacherLayout;
