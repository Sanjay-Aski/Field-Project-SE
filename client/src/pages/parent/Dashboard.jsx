import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUserGraduate, FaBook, FaCalendarAlt, FaClipboardList, 
  FaEnvelope, FaUsers, FaChild, FaChalkboardTeacher 
} from 'react-icons/fa';

const ParentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingForms, setPendingForms] = useState(0);
  
  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/parent/children', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Server responded with ${response.status}`);
        }
        
        setChildren(Array.isArray(data) ? data : []);
        
        // Fetch pending forms count
        const formsResponse = await fetch('http://localhost:5000/parent/forms/not-filled', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          if (formsData.success && formsData.forms) {
            setPendingForms(formsData.forms.length);
          }
        }
        
      } catch (error) {
        console.error('Error fetching children data:', error);
        setError(error.message);
        toast.error('Failed to load your children data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChildrenData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-sand min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Children Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center">
              <FaChild className="mr-2 text-primary-600" /> My Children
            </h2>
          </div>
          
          {children.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No children found under your account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <div key={child._id} className="bg-primary-50 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <FaUserGraduate className="text-primary-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-lg text-secondary-800">{child.fullName}</h3>
                      <p className="text-sm text-secondary-600">Class {child.class}-{child.division} | Roll: {child.roll}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link 
                      to={`/parent/attendance/${child._id}`}
                      className="flex items-center justify-center p-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <FaCalendarAlt className="mr-1" /> Attendance
                    </Link>
                    <Link 
                      to={`/parent/marksheet/${child._id}`}
                      className="flex items-center justify-center p-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <FaBook className="mr-1" /> Marksheet
                    </Link>
                    <Link 
                      to={`/parent/forms/${child._id}`}
                      className="flex items-center justify-center p-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      <FaClipboardList className="mr-1" /> Forms
                    </Link>
                    <Link 
                      to={`/parent/chat/${child._id}`}
                      className="flex items-center justify-center p-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      <FaEnvelope className="mr-1" /> Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-secondary-800">Messages</h3>
              <Link to="/parent/chat" className="text-primary-600 text-sm hover:underline">View All</Link>
            </div>
            <div className="flex items-center mt-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FaEnvelope className="text-blue-600" />
              </div>
              <div className="ml-4">
                <Link to="/parent/chat" className="block font-medium text-secondary-800 hover:text-primary-600">
                  Teacher Communications
                </Link>
                <p className="text-sm text-gray-500">Connect with your child's teachers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-secondary-800">Forms</h3>
              <div className="flex space-x-2">
                <Link to="/parent/forms/pending" className="text-primary-600 text-sm hover:underline">Pending</Link>
                <span className="text-gray-300">|</span>
                <Link to="/parent/forms/completed" className="text-green-600 text-sm hover:underline">Completed</Link>
              </div>
            </div>
            <div className="flex items-center mt-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FaClipboardList className="text-purple-600" />
              </div>
              <div className="ml-4">
                <span className="block font-medium text-secondary-800">
                  {pendingForms} {pendingForms === 1 ? 'form' : 'forms'} pending
                </span>
                <p className="text-sm text-gray-500">Forms that need your attention</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-secondary-800">Teachers</h3>
              <Link to="/parent/teachers" className="text-primary-600 text-sm hover:underline">View All</Link>
            </div>
            <div className="flex items-center mt-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FaChalkboardTeacher className="text-green-600" />
              </div>
              <div className="ml-4">
                <Link to="/parent/teachers" className="block font-medium text-secondary-800 hover:text-primary-600">
                  View Class Teachers
                </Link>
                <p className="text-sm text-gray-500">Your child's educators</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Group Chats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center">
              <FaUsers className="mr-2 text-primary-600" /> Group Discussions
            </h2>
            <Link to="/parent/chat/groups" className="text-primary-600 text-sm hover:underline">View All</Link>
          </div>
          
          <div className="text-center py-6 text-gray-500">
            <p>Join class discussions and parent committees</p>
            <Link to="/parent/chat/groups" className="mt-2 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Explore Groups
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
