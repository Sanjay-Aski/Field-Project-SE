import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ParentDashboard = () => {
  const { logout } = useAuth();
  
  return (
    <div className="p-6 bg-sand min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-cream rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-secondary-800">Parent Dashboard</h1>
          <p className="mb-4 text-secondary-600">Welcome to the parent dashboard. This is a placeholder page.</p>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
