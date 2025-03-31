import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  FaUserShield, FaChalkboardTeacher, FaUsers, FaUser, 
  FaUserGraduate, FaSignOutAlt, FaGift, FaBars, FaTimes,
  FaTicketAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../ui/Footer';

const AdminLayout = () => {
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
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const navItems = [
    { path: '/admin/dashboard', icon: <FaUserShield />, label: 'Dashboard' },
    { path: '/admin/teachers', icon: <FaChalkboardTeacher />, label: 'Teachers' },
    { path: '/admin/parents', icon: <FaUsers />, label: 'Parents' },
    { path: '/admin/students', icon: <FaUserGraduate />, label: 'Students' },
    { path: '/admin/donations', icon: <FaGift />, label: 'Donations' },
    { path: '/admin/complaints', icon: <FaTicketAlt />, label: 'Support Tickets' },
  ];
  
  return (
    <div className="min-h-screen bg-sand flex flex-col md:flex-row">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden bg-primary-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <FaUserShield className="mr-2 h-6 w-6" />
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>
        <button onClick={toggleMobileMenu} className="text-white">
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block bg-secondary-800 text-white w-full md:w-64 md:min-h-screen flex-shrink-0 transition-all duration-300`}
      >
        <div className="hidden md:flex items-center p-4 border-b border-secondary-700">
          <FaUserShield className="mr-3 h-6 w-6 text-primary-500" />
          <h1 className="text-xl font-bold">Admin Portal</h1>
        </div>
        
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center py-3 px-6 hover:bg-secondary-700 transition-colors ${
                      isActive ? 'bg-secondary-700 border-l-4 border-primary-500' : ''
                    }`
                  }
                >
                  <span className="mr-3 text-primary-400">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center py-3 px-6 text-red-400 hover:bg-secondary-700 transition-colors"
              >
                <span className="mr-3"><FaSignOutAlt /></span>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content with Footer */}
      <div className="flex-grow flex flex-col">
        <div className="flex-grow p-6 md:p-8 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
