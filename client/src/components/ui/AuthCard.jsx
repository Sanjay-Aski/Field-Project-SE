import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaSchool } from 'react-icons/fa';

const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="flex flex-col min-h-screen bg-sand">
      {/* Top School Banner */}
      <div className="w-full bg-cream shadow-md py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* School Logo and Name */}
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-primary-500 p-3 rounded-full mr-4 shadow-md">
                <FaSchool className="h-10 w-10 text-secondary-800" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-secondary-800 tracking-tight">R. I. VIDYA MANDIR</h1>
                <p className="text-secondary-600 text-sm mt-1">Excellence in Education Since 1995</p>
              </div>
            </div>
            
            {/* School Image */}
            <div className="w-36 h-36 bg-primary-100 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
              {/* Actual school logo instead of placeholder */}
              <img 
                src="/assets/images/school-logo.png" 
                alt="R. I. Vidya Mandir" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/300x300/FAC738/1e293b?text=School+Logo";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auth Container */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-cream rounded-lg shadow-xl flex flex-col md:flex-row overflow-hidden">
          {/* Left side - Brand section */}
          <div className="md:w-2/5 bg-primary-500 text-secondary-800 p-8 flex flex-col">
            <div className="flex items-center mb-6">
              <FaGraduationCap className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-bold">SchoolTrack</h2>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            {subtitle && <p className="text-secondary-800 opacity-90 mb-8">{subtitle}</p>}
            
            <div className="mt-auto hidden md:block">
              <div className="border-t border-secondary-800 opacity-20 pt-6 mt-6">
                <h3 className="text-lg font-medium mb-2">School Management System</h3>
                <p className="text-secondary-800 opacity-75 text-sm">
                  Connect administrators, teachers, and parents in one centralized platform.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Form section */}
          <div className="md:w-3/5 p-8">
            {children}
            
            {footer && (
              <div className="mt-6 text-center text-sm text-secondary-500">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
