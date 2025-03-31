import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/#about' },
    { name: 'Facilities', path: '/#facilities' },
    { name: 'Contact', path: '/#contact' },
    { name: 'Support', path: '/support' },
  ];

  const navbarClasses = `fixed w-full z-30 transition-all duration-300 ${
    isScrolled ? 'bg-white shadow text-primary-900' : 'bg-transparent text-white'
  }`;

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="font-bold text-xl">R.I. Vidya Mandir</Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path}
                className={`hover:text-primary-500 transition-colors ${
                  location.pathname === link.path ? 'font-semibold' : ''
                }`}
              >
                {link.name === 'Support' ? (
                  <span className="flex items-center">
                    <FaQuestionCircle className="mr-1" /> {link.name}
                  </span>
                ) : link.name}
              </Link>
            ))}
            {user ? (
              <Link 
                to={`/${user.role}/dashboard`} 
                className={`px-4 py-2 rounded-md transition-colors ${
                  isScrolled
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white text-primary-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                className={`px-4 py-2 rounded-md transition-colors ${
                  isScrolled
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white text-primary-600 hover:bg-gray-100'
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-2xl focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 py-2 bg-white text-gray-900 rounded-lg shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name === 'Support' ? (
                  <span className="flex items-center">
                    <FaQuestionCircle className="mr-2" /> {link.name}
                  </span>
                ) : link.name}
              </Link>
            ))}
            {user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="block px-4 py-2 mt-1 bg-primary-600 text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-2 mt-1 bg-primary-600 text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
