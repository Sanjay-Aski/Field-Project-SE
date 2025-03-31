import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaQuestionCircle, FaExclamationCircle, FaCommentAlt } from 'react-icons/fa';
import Footer from '../ui/Footer';
import Navbar from '../ui/Navbar';

const SupportLayout = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col bg-sand">
      
      <div className="container mx-auto px-4 py-8 flex-grow mt-16">
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-secondary-800">Support Center</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary-600 p-4">
            <nav className="flex flex-wrap space-x-1">
              <Link
                to="/support"
                className="px-4 py-2 rounded-md text-white hover:bg-primary-700 transition-colors flex items-center"
              >
                <FaQuestionCircle className="mr-2" /> Help Center
              </Link>
              <Link
                to="/support/faq"
                className="px-4 py-2 rounded-md text-white hover:bg-primary-700 transition-colors flex items-center"
              >
                <FaQuestionCircle className="mr-2" /> FAQs
              </Link>
              <Link
                to="/support/complaint"
                className="px-4 py-2 rounded-md text-white hover:bg-primary-700 transition-colors flex items-center"
              >
                <FaExclamationCircle className="mr-2" /> Raise a Complaint
              </Link>
              <Link
                to="/support/feedback"
                className="px-4 py-2 rounded-md text-white hover:bg-primary-700 transition-colors flex items-center"
              >
                <FaCommentAlt className="mr-2" /> Feedback
              </Link>
            </nav>
          </div>
          
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SupportLayout;
