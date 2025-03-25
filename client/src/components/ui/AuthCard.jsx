import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap } from 'react-icons/fa';

const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-tr from-primary-700 to-primary-500">
      <div className="w-full max-w-md m-auto p-6 bg-white rounded-lg shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
            <FaGraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-800">{title}</h1>
          {subtitle && <p className="text-secondary-500 text-sm mt-1">{subtitle}</p>}
        </div>
        
        <div className="space-y-4">
          {children}
        </div>
        
        {footer && (
          <div className="mt-6 text-center text-sm text-secondary-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCard;
