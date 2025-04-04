import React, { useState, useEffect } from 'react';
import { FaGift, FaCheck, FaTimes } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import { toast } from 'react-toastify';

const DonationList = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/admin/donations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setDonations(data.donations || []);
      } else {
        throw new Error(data.message || 'Failed to fetch donations');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproveRequest = async (donationId, userId) => {
    try {
      console.log(`Approving donation ${donationId} for user ${userId}`);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/admin/donation/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          donationId, 
          userId,
          quantity: 1
        })
      });
      
      const data = await response.json();
      console.log('Response from server:', data);
      
      if (!response.ok) {
        // If the error is about donation status, offer to fix it
        if (data.error && data.error.includes('donation is not available')) {
          const shouldFix = window.confirm(
            'The donation status appears to be incorrect. Would you like to fix it automatically?'
          );
          
          if (shouldFix) {
            await fixAndRetry(donationId, userId);
            return;
          }
        }
        
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      toast.success('Donation request approved successfully');
      fetchDonations();
    } catch (error) {
      console.error('Error approving donation request:', error);
      toast.error(`Failed to approve request: ${error.message}`);
    }
  };

  const fixAndRetry = async (donationId, userId) => {
    try {
      const token = localStorage.getItem('token');
      
      // First try to fix all donation statuses
      await fetch('http://localhost:5000/admin/donations/fix-statuses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.info('Trying to fix donation status...');
      
      // Wait a moment for the fix to complete
      setTimeout(async () => {
        // Then retry the approval
        const response = await fetch('http://localhost:5000/admin/donation/assign', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            donationId, 
            userId,
            quantity: 1
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Request still failed with status ${response.status}`);
        }
        
        toast.success('Donation request approved successfully');
        fetchDonations();
      }, 1000);
    } catch (error) {
      console.error('Error fixing and retrying:', error);
      toast.error(`Could not fix the issue: ${error.message}`);
    }
  };
  
  const handleRejectRequest = async (donationId, userId) => {
    try {
      console.log(`Rejecting donation ${donationId} for user ${userId}`);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/admin/donation/reject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          donationId, 
          userId
        })
      });
      
      const data = await response.json();
      console.log('Response from server:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      toast.success('Donation request rejected successfully');
      
      // Update the UI optimistically
      const updatedDonations = donations.map(donation => {
        if (donation._id === donationId) {
          return {
            ...donation,
            interestedUsers: donation.interestedUsers.map(user => {
              if (user.userId === userId) {
                return { ...user, status: 'rejected' };
              }
              return user;
            })
          };
        }
        return donation;
      });
      
      setDonations(updatedDonations);
      
      // Fetch latest data after a short delay
      setTimeout(() => {
        fetchDonations();
      }, 500);
    } catch (error) {
      console.error('Error rejecting donation request:', error);
      toast.error(`Failed to reject request: ${error.message}`);
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
      render: (donation) => donation.donorName
    },
    { 
      key: 'requests', 
      label: 'Requests',
      sortable: false,
      render: (donation) => (
        <div>
          {donation.interestedUsers && donation.interestedUsers.length > 0 ? (
            <div className="space-y-2">
              {donation.interestedUsers.map((user, index) => (
                <div key={index} className="text-sm border-b pb-1 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <span>{user.userName}</span>
                    {user.status === 'pending' && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleApproveRequest(donation._id, user.userId)}
                          className="text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <FaCheck size={16} />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(donation._id, user.userId)}
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
            {donations.filter(d => d.interestedUsers?.some(user => user.status === 'pending')).length}
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
