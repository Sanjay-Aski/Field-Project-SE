import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaChevronLeft } from 'react-icons/fa';
import Footer from '../components/ui/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-sand">
      <div className="flex items-center justify-center px-4 py-16 flex-grow">
        <div className="max-w-lg w-full bg-cream shadow-lg rounded-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-primary-100">
              <FaExclamationTriangle className="h-10 w-10 text-primary-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-secondary-800 mb-2">Page Not Found</h1>
          <p className="text-secondary-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-secondary-800 rounded-md hover:bg-primary-600 transition-colors"
          >
            <FaChevronLeft className="mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
