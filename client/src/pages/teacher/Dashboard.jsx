import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaUserAlt, FaChalkboardTeacher, FaBook, FaUsers, FaCalendarAlt, FaEnvelope, FaArrowRight } from 'react-icons/fa';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://192.168.103.107:5000/teacher/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `Server responded with ${response.status}`);
        }
        
        if (!data.teacher) {
          throw new Error('Teacher data not found in server response');
        }
        
        setTeacher(data.teacher);
      } catch (error) {
        console.error('Error fetching teacher profile:', error);
        setError(`Failed to load teacher profile: ${error.message}`);
        toast.error('Failed to load teacher data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherProfile();
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
      <div className="bg-red-100 p-4 rounded-md border border-red-300 text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!teacher) {
    return (
      <div className="bg-yellow-100 p-4 rounded-md border border-yellow-300 text-yellow-800">
        <p>No teacher profile data available. Please contact the administrator.</p>
      </div>
    );
  }

  // Format subjects for display - Add null check to prevent errors
  const formattedSubjects = teacher.subjects ? teacher.subjects.reduce((acc, subject) => {
    const key = `${subject.class}-${subject.division}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(subject.subject);
    return acc;
  }, {}) : {};

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Teacher Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary-600 p-4 text-white">
            <h2 className="text-xl font-semibold">Teacher Profile</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <FaUserAlt className="text-primary-600 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">{teacher.fullName}</h3>
              <p className="text-gray-600 flex items-center mt-1">
                <FaEnvelope className="mr-2" /> {teacher.email}
              </p>
            </div>
            
            {teacher.classTeacher && (
              <div className="mb-4 p-4 bg-green-100 rounded-md">
                <h4 className="text-green-800 font-medium flex items-center mb-2">
                  <FaUsers className="mr-2" /> Class Teacher
                </h4>
                <p className="text-green-700 mb-3">
                  Class {teacher.classTeacher.class}-{teacher.classTeacher.division}
                </p>
                <Link 
                  to={`/teacher/classroom/${teacher.classTeacher.class}/${teacher.classTeacher.division}`}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Manage Classroom <FaArrowRight className="ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Subjects Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-4 text-white">
            <h2 className="text-xl font-semibold">My Class</h2>
          </div>
          <div className="p-6">
            {Object.keys(formattedSubjects).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(formattedSubjects).map(([classInfo, subjects]) => (
                  <div key={classInfo} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800 flex items-center">
                        <FaChalkboardTeacher className="mr-2 text-blue-500" />
                        Class {classInfo}
                      </h4>
                      <Link
                        to={`/teacher/classroom/${classInfo.split('-')[0]}/${classInfo.split('-')[1]}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Class <FaArrowRight className="inline ml-1" />
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject, index) => (
                        <span 
                          key={index} 
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FaBook className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p>No subjects assigned yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-secondary-600 p-4 text-white">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link to="/teacher/forms" className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors flex flex-col items-center justify-center text-center">
                <FaBook className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Forms</span>
              </Link>
              
              <Link to="/teacher/chat" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex flex-col items-center justify-center text-center">
                <FaUsers className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Parent Chat</span>
              </Link>
              
              <Link to="/teacher/attendance" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex flex-col items-center justify-center text-center">
                <FaCalendarAlt className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Attendance</span>
              </Link>
              
              <Link to="/teacher/marksheets" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors flex flex-col items-center justify-center text-center">
                <FaBook className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Marksheets</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-6">
            <p className="text-gray-500">No recent activities to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
