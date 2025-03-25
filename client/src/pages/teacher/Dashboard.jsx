import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard = () => {
  const { logout } = useAuth();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
      <p className="mb-4">Welcome to the teacher dashboard. This is a placeholder page.</p>
      <button 
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default TeacherDashboard;
