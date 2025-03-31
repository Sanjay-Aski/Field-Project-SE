import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaUserGraduate, FaCalendarAlt, FaBook, FaClipboardList, FaChartBar, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ClassroomView = () => {
  const { classId, division } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    const fetchClassStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Update the API call to include class and division as query parameters
        const response = await fetch(`http://localhost:5000/teacher/class-students?class=${classId}&division=${division}`, {
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
        
        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching class students:', error);
        setError('Failed to load students. Please try again later.');
        toast.error('Failed to load class data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassStudents();
  }, [classId, division]);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return renderStudentsTab();
      case 'attendance':
        return renderAttendanceTab();
      case 'marksheet':
        return renderMarksheetTab();
      case 'forms':
        return renderFormsTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderStudentsTab();
    }
  };
  
  const renderStudentsTab = () => {
    if (students.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FaUserGraduate className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-500">There are no students assigned to this class yet.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                        <FaUserGraduate className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.parentId ? (
                      <div className="text-sm text-gray-900">{student.parentId.fullName}</div>
                    ) : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">Attendance</button>
                      <button className="text-blue-600 hover:text-blue-900">Marksheet</button>
                      <button className="text-green-600 hover:text-green-900">Message</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderAttendanceTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Class Attendance</h3>
          <div className="flex space-x-3">
            <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">Set Working Days</button>
            <button className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">Mark Attendance</button>
            <button className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">Upload Excel</button>
          </div>
        </div>
        
        <div className="text-center py-12">
          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Management</h3>
          <p className="text-gray-500 mb-4">Start by setting working days or marking attendance for your class.</p>
        </div>
      </div>
    );
  };
  
  const renderMarksheetTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Class Marksheets</h3>
          <div className="flex space-x-3">
            <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">Create Marksheet</button>
            <button className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">Upload Excel</button>
          </div>
        </div>
        
        <div className="text-center py-12">
          <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Marksheet Management</h3>
          <p className="text-gray-500 mb-4">Create marksheets to track student performance and academic progress.</p>
        </div>
      </div>
    );
  };
  
  const renderFormsTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Class Forms</h3>
          <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">Create Form</button>
        </div>
        
        <div className="text-center py-12">
          <FaClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Form Management</h3>
          <p className="text-gray-500 mb-4">Create and distribute forms to students and parents.</p>
        </div>
      </div>
    );
  };
  
  const renderAnalyticsTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <FaChartBar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Class Analytics</h3>
          <p className="text-gray-500 mb-4">View performance analytics and statistics for your class.</p>
        </div>
      </div>
    );
  };
  
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          Class {classId}-{division} View
        </h1>
        
        <Link
          to="/teacher/dashboard"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600">Manage your classroom, students, attendance, and marksheets</p>
      </div>
      
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap">
              <button
                className={`${
                  activeTab === 'students'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                onClick={() => setActiveTab('students')}
              >
                <FaUserGraduate className="mr-2" />
                Students
              </button>
              
              <button
                className={`${
                  activeTab === 'attendance'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                onClick={() => setActiveTab('attendance')}
              >
                <FaCalendarAlt className="mr-2" />
                Attendance
              </button>
              
              <button
                className={`${
                  activeTab === 'marksheet'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                onClick={() => setActiveTab('marksheet')}
              >
                <FaBook className="mr-2" />
                Marksheets
              </button>
              
              <button
                className={`${
                  activeTab === 'forms'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                onClick={() => setActiveTab('forms')}
              >
                <FaClipboardList className="mr-2" />
                Forms
              </button>
              
              <button
                className={`${
                  activeTab === 'analytics'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                onClick={() => setActiveTab('analytics')}
              >
                <FaChartBar className="mr-2" />
                Analytics
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {renderTabContent()}
    </div>
  );
};

export default ClassroomView;
