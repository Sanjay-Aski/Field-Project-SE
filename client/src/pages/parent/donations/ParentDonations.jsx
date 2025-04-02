import React, { useState, useEffect } from 'react';
import { FaGift, FaHandHoldingHeart, FaHistory, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ParentDonations = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState({});
  const [showDonationForm, setShowDonationForm] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, [activeTab]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (activeTab === 'available') {
        const response = await fetch('http://localhost:5000/parent/donations/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.donations) {
          throw new Error('Invalid response format from server');
        }
        
        const enhancedDonations = await Promise.all(data.donations.map(async (donation) => {
          try {
            const checkResponse = await fetch(`http://localhost:5000/parent/donation/${donation._id}/check`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              return {
                ...donation,
                alreadyRequested: checkData.alreadyRequested
              };
            }
            
            return {
              ...donation,
              alreadyRequested: false
            };
          } catch (err) {
            console.warn(`Couldn't check request status for donation ${donation._id}:`, err);
            return {
              ...donation,
              alreadyRequested: false
            };
          }
        }));
        
        setAvailableDonations(enhancedDonations || []);
      } else if (activeTab === 'requests') {
        const response = await fetch('http://localhost:5000/parent/donations/my-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error('Invalid response format from server');
        }
        
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} donations:`, error);
      toast.error(`Failed to load donation data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestDonation = async (donationId) => {
    try {
      setRequestLoading(prev => ({ ...prev, [donationId]: true }));
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/parent/donation/${donationId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      toast.success('Donation request submitted successfully');
      
      setAvailableDonations(donations => 
        donations.map(d => 
          d._id === donationId ? { ...d, alreadyRequested: true } : d
        )
      );
      
    } catch (error) {
      toast.error(`Failed to request donation: ${error.message}`);
    } finally {
      setRequestLoading(prev => ({ ...prev, [donationId]: false }));
    }
  };
  
  const renderAvailableDonations = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }
    
    if (availableDonations.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaGift className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500">No donations are available at the moment.</p>
          <p className="text-gray-400 mt-2">Check back later or create your own donation.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableDonations.map(donation => (
          <div key={donation._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`py-2 px-4 ${donation.isAdminDonation ? 'bg-blue-600' : 'bg-primary-600'} text-white flex justify-between items-center`}>
              <div className="font-medium">{donation.item}</div>
              {donation.category && (
                <span className="text-xs bg-white text-gray-800 px-2 py-0.5 rounded-full">
                  {donation.category}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FaHandHoldingHeart className="mr-2" />
                <span>Donated by: {donation.donorName}</span>
              </div>
              <p className="text-gray-700 mb-4">{donation.description}</p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-sm font-bold">Available:</span>
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {donation.quantity} {donation.quantity > 1 ? 'items' : 'item'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(donation.donationDate).toLocaleDateString()}
                </div>
              </div>
              
              <button
                onClick={() => handleRequestDonation(donation._id)}
                disabled={donation.alreadyRequested || requestLoading[donation._id]}
                className={`w-full px-4 py-2 rounded-md text-white text-sm font-medium transition-colors flex items-center justify-center
                  ${donation.alreadyRequested 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-700'}`
                }
              >
                {requestLoading[donation._id] ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                ) : donation.alreadyRequested ? (
                  'Already Requested'
                ) : (
                  'Request Item'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderMyRequests = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }
    
    if (myRequests.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FaHistory className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500">You haven't requested any donations yet.</p>
          <p className="text-gray-400 mt-2">Check available donations and request items you need.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {myRequests.map(request => (
              <tr key={request._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{request.item}</div>
                  <div className="text-xs text-gray-500">{request.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {request.donorName}
                    {request.isAdminDonation && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        School
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.requestDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Donation System</h1>
        <p className="text-gray-600 mt-2">
          Browse available donations from school and other parents, or request items you need.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex space-x-1 mb-4 md:mb-0">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'available' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available Donations
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'requests' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Requests
          </button>
        </div>
        
        <button
          onClick={() => setShowDonationForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <FaPlus className="mr-2" /> Donate Items
        </button>
      </div>
      
      {activeTab === 'available' ? renderAvailableDonations() : renderMyRequests()}
      
      {showDonationForm && (
        <DonationForm
          onClose={() => setShowDonationForm(false)}
          onDonationAdded={() => {
            setShowDonationForm(false);
            toast.success('Donation added successfully');
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Donation Form Component
const DonationForm = ({ onClose, onDonationAdded }) => {
  const [items, setItems] = useState([{ item: '', quantity: 1, description: '' }]);
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  
  const addItem = () => {
    setItems([...items, { item: '', quantity: 1, description: '' }]);
  };
  
  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    for (let item of items) {
      if (!item.item || !item.description) {
        toast.error('Please fill in all fields for each item');
        return;
      }
      if (item.quantity < 1) {
        toast.error('Quantity must be at least 1');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/parent/donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create donation');
      }
      
      onDonationAdded();
    } catch (error) {
      console.error('Error donating items:', error);
      toast.error(`Failed to donate: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Donate Items</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {items.map((item, index) => (
            <div key={index} className="mb-6 p-4 border rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium">Item #{index + 1}</h3>
                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={item.item}
                  onChange={(e) => handleChange(index, 'item', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Item Type</option>
                  <option value="Books">Books</option>
                  <option value="Stationary">Stationery</option>
                  <option value="Uniforms">Uniforms</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  required
                />
              </div>
              
              <div className="mb-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={item.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows="2"
                  placeholder="Provide details about the item"
                  required
                ></textarea>
              </div>
            </div>
          ))}
          
          <div className="mb-4">
            <button 
              type="button" 
              onClick={addItem} 
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
            >
              <FaPlus className="mr-1" /> Add Another Item
            </button>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                  Submitting...
                </>
              ) : (
                'Submit Donation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentDonations;
