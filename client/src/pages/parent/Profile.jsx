import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUserCircle, FaPhone, FaMapMarkerAlt, FaEnvelope, FaChild, FaCalendarAlt, FaHistory } from 'react-icons/fa';

const ParentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParentProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://192.168.103.107:5000/parent/profile', {
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
        
        setProfile(data.parent);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        toast.error('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParentProfile();
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
  
  if (!profile) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <p className="font-semibold">No Profile Found</p>
        <p>Profile information could not be loaded.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">My Profile</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-primary-600 text-white p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-24 h-24 rounded-full bg-primary-300 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
              <FaUserCircle className="w-16 h-16 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.fullName || profile.email}</h2>
              <p className="text-primary-100">Parent</p>
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">Contact Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaEnvelope className="text-primary-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-secondary-800">{profile.email}</p>
                  </div>
                </div>
                
                {profile.phoneNo && (
                  <div className="flex items-start">
                    <FaPhone className="text-primary-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-secondary-800">{profile.phoneNo}</p>
                    </div>
                  </div>
                )}
                
                {profile.address && (
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-primary-600 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-secondary-800">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Children Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                <span className="flex items-center">
                  <FaChild className="mr-2 text-primary-600" />
                  Children
                </span>
              </h3>
              
              {profile.children && profile.children.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {profile.children.map(child => (
                    <li key={child._id} className="py-3">
                      <p className="font-medium text-secondary-800">{child.fullName}</p>
                      <p className="text-sm text-gray-600">
                        Class {child.class}-{child.division} | Roll No: {child.roll}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No children information available</p>
              )}
            </div>
          </div>
          
          {/* Account Information */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4">Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="text-secondary-800 flex items-center">
                  <FaCalendarAlt className="mr-2 text-primary-500" />
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-secondary-800 flex items-center">
                  <FaHistory className="mr-2 text-primary-500" />
                  {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentProfile;
