import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGift, FaCheck, FaTimes } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import { toast } from 'react-toastify';

const DonationList = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        // In a real app, you would fetch actual data from your API
        // For now, let's create mock data
        setTimeout(() => {
          const statuses = ['available', 'claimed', 'pending'];
          const items = ['Books', 'Uniform', 'Stationery', 'Sports Equipment', 'Computer', 'Musical Instrument'];
          
          const mockDonations = Array.from({ length: 20 }, (_, index) => ({
            _id: `d${index + 1}`,
            item: items[Math.floor(Math.random() * items.length)],
            quantity: Math.floor(Math.random() * 10) + 1,
            description: `Description for donation ${index + 1}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            donationDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
            donorId: {
              _id: `p${Math.floor(Math.random() * 10) + 1}`,
              fullName: `Parent ${Math.floor(Math.random() * 10) + 1}`
            },
            interestedUsers: Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
              userId: {
                _id: `p${Math.floor(Math.random() * 10) + 20}`,
                fullName: `Parent ${Math.floor(Math.random() * 10) + 20}`
              },
              requestDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
              status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)]
            }))
          }));
          
          setDonations(mockDonations);
          setLoading(false);
        }, 1000);
        
        // Uncomment below for actual API call
        /*
        const response = await axios.get('/api/admin/donations', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDonations(response.data);
        setLoading(false);
        */
      } catch (error) {
        console.error('Error fetching donations:', error);
        toast.error('Failed to load donations data');
        setLoading(false);
      }
    };
    
    fetchDonations();
  }, []);
  
  const handleApproveRequest = async (donationId, userId) => {
    try {
      // In a real app, you would make an API call to approve the request
      const updatedDonations = donations.map(donation => {
        if (donation._id === donationId) {
          return {
            ...donation,
            interestedUsers: donation.interestedUsers.map(user => {
              if (user.userId._id === userId) {
                return { ...user, status: 'approved' };
              }
              return user;
            }),
            status: 'claimed'
          };
        }
        return donation;
      });
      
      setDonations(updatedDonations);
      toast.success('Donation request approved successfully');
      
      // Uncomment below for actual API call
      /*
      await axios.post('/api/admin/donations/assign', { 
        donationId, 
        userId,
        quantity: 1 // Or the requested quantity
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Donation request approved successfully');
      */
    } catch (error) {
      console.error('Error approving donation request:', error);
      toast.error('Failed to approve donation request');
    }
  };
  
  const handleRejectRequest = async (donationId, userId) => {
    try {
      // In a real app, you would make an API call to reject the request
      const updatedDonations = donations.map(donation => {
        if (donation._id === donationId) {
          return {
            ...donation,
            interestedUsers: donation.interestedUsers.map(user => {
              if (user.userId._id === userId) {
                return { ...user, status: 'rejected' };
              }
              return user;
            })
          };
        }
        return donation;
      });
      
      setDonations(updatedDonations);
      toast.success('Donation request rejected');
      
      // Uncomment below for actual API call
      /*
      await axios.post('/api/admin/donations/reject', { 
        donationId, 
        userId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Donation request rejected');
      */
    } catch (error) {
      console.error('Error rejecting donation request:', error);
      toast.error('Failed to reject donation request');
    }
  };
  
  const columns = [
    { key: 'item', label: 'Item' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'description', label: 'Description' },
    { 
      key: 'status', 
      label: 'Status',
      render: (donation) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          donation.status === 'available' ? 'bg-green-100 text-green-800' :
          donation.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
        </span>
      )
    },
    { 
      key: 'donationDate', 
      label: 'Donation Date',
      render: (donation) => new Date(donation.donationDate).toLocaleDateString()
    },
    { 
      key: 'donor', 
      label: 'Donor',
      render: (donation) => donation.donorId.fullName
    },
    { 
      key: 'requests', 
      label: 'Requests',
      sortable: false,
      render: (donation) => (
        <div>
          {donation.interestedUsers.length > 0 ? (
            <div className="space-y-2">
              {donation.interestedUsers.map((user, index) => (
                <div key={index} className="text-sm border-b pb-1 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <span>{user.userId.fullName}</span>
                    {user.status === 'pending' && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleApproveRequest(donation._id, user.userId._id)}
                          className="text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <FaCheck size={16} />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(donation._id, user.userId._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Reject"
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    )}
                    {user.status !== 'pending' && (
                      <span className={`text-xs ${
                        user.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Requested: {new Date(user.requestDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">No requests</span>
          )}
        </div>
      )
    }
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Manage Donations</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <FaGift size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-800">Donation System</h2>
            <p className="text-gray-600">Manage donations and approve requests from parents. Parents can donate items and request available donations.</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-600 mb-2">Available</h3>
          <p className="text-3xl font-bold">
            {donations.filter(d => d.status === 'available').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Donations ready to be claimed</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-yellow-600 mb-2">Pending</h3>
          <p className="text-3xl font-bold">
            {donations.filter(d => d.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Donations with pending requests</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Claimed</h3>
          <p className="text-3xl font-bold">
            {donations.filter(d => d.status === 'claimed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Donations that have been assigned</p>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={donations}
        title="Donation List"
        emptyMessage="No donations found. Parents can create donations through their dashboard."
      />
    </div>
  );
};

export default DonationList;
