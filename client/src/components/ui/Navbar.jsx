import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navbarClasses = `fixed w-full z-50 transition-all duration-300 ${
    scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
  }`;

  const textColorClass = scrolled ? 'text-gray-800' : 'text-white';
  const logoColorClass = scrolled ? 'text-primary-600' : 'text-white';

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className={`text-2xl font-bold ${logoColorClass}`}>R.I. Vidya Mandir</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className={`font-medium ${textColorClass} hover:text-primary-500`}>
              About
            </a>
            <a href="#facilities" className={`font-medium ${textColorClass} hover:text-primary-500`}>
              Facilities
            </a>
            <a href="#contact" className={`font-medium ${textColorClass} hover:text-primary-500`}>
              Contact
            </a>
            {user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <span className="flex items-center">
                  <FaUserCircle className="mr-2" /> Login
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-2xl" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <FaTimes className={textColorClass} />
            ) : (
              <FaBars className={textColorClass} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 py-2 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col space-y-3 px-4 py-2">
              <a 
                href="#about" 
                className="text-gray-800 hover:text-primary-600 py-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                About
              </a>
              <a 
                href="#facilities" 
                className="text-gray-800 hover:text-primary-600 py-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Facilities
              </a>
              <a 
                href="#contact" 
                className="text-gray-800 hover:text-primary-600 py-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </a>
              {user ? (
                <Link
                  to={`/${user.role}/dashboard`}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center justify-center">
                    <FaUserCircle className="mr-2" /> Login
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
