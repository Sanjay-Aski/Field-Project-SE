import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaUsers, FaUserGraduate, FaGift } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    teacherCount: 0,
    parentCount: 0,
    studentCount: 0,
    donationCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://192.168.35.107:5000/admin/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        
        setStats({
          teacherCount: data.teacherCount || 0,
          parentCount: data.parentCount || 0,
          studentCount: data.studentCount || 0,
          donationCount: data.donationCount || 0,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard statistics'
        }));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Teachers',
      count: stats.teacherCount,
      icon: <FaChalkboardTeacher />,
      color: 'bg-blue-500',
      link: '/admin/teachers'
    },
    {
      title: 'Parents',
      count: stats.parentCount,
      icon: <FaUsers />,
      color: 'bg-green-500',
      link: '/admin/parents'
    },
    {
      title: 'Students',
      count: stats.studentCount,
      icon: <FaUserGraduate />,
      color: 'bg-orange-500',
      link: '/admin/students'
    },
    {
      title: 'Donations',
      count: stats.donationCount,
      icon: <FaGift />,
      color: 'bg-purple-500',
      link: '/admin/donations'
    }
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{stats.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-sand min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">R.I. Vidya Mandir Dashboard</h1>
        <p className="text-gray-600">Welcome to the SchoolTrack management system for R.I. Vidya Mandir.</p>
      </div>
      
      {/* School Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-primary-700 mb-4">School Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Established</h3>
            <p className="text-lg">1994</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">UDISE Code</h3>
            <p className="text-lg">27210610202</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="text-lg">Kalyan Dombivli-URC1, Thane</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">School Type</h3>
            <p className="text-lg">Co-educational (Class 1-7)</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Medium</h3>
            <p className="text-lg">English</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Management</h3>
            <p className="text-lg">Private Unaided</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`${card.color} h-2`}></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-700">{card.title}</h3>
                  <p className="text-3xl font-bold text-secondary-800 mt-1">{card.count}</p>
                </div>
                <div className={`${card.color} bg-opacity-20 p-3 rounded-full text-xl ${card.color.replace('bg-', 'text-')}`}>
                  {card.icon}
                </div>
              </div>
              <a 
                href={card.link} 
                className="block text-sm text-primary-600 hover:text-primary-800 hover:underline mt-4"
              >
                View Details &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-secondary-800 mb-4">Recent Activity</h2>
        <p className="text-secondary-600">
          Welcome to the admin dashboard. Here you can manage teachers, parents, students, and view donation information.
        </p>
        <p className="text-secondary-600 mt-2">
          Use the navigation menu to access different sections of the admin portal.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
