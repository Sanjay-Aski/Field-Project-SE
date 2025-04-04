import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaFilter, FaSearch, FaReply, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [updating, setUpdating] = useState(false);
  const [statusUpdateOnly, setStatusUpdateOnly] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/admin/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setComplaints(data.complaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load complaints. Please try again later.');
      toast.error('Failed to load complaints data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseText('');
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!responseText.trim()) {
      toast.error('Response text is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/admin/complaints/${selectedComplaint._id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responseText,
          status: resolveStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      toast.success('Response submitted successfully');
      fetchComplaints();
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdateOnly) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/admin/complaints/${selectedComplaint._id}/update-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: statusUpdateOnly
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      toast.success('Status updated successfully');
      fetchComplaints();
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (selectedComplaint) {
      setStatusUpdateOnly(selectedComplaint.status);
    }
  }, [selectedComplaint]);

  const filteredComplaints = complaints.filter(complaint => {
    if (filters.status && complaint.status !== filters.status) {
      return false;
    }

    if (filters.priority && complaint.priority !== filters.priority) {
      return false;
    }

    if (filters.search) {
      const searchValue = filters.search.toLowerCase();
      const matchesSubject = complaint.subject.toLowerCase().includes(searchValue);
      const matchesName = complaint.userName.toLowerCase().includes(searchValue);
      if (!matchesSubject && !matchesName) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error && complaints.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Support Tickets</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
            <FaFilter className="mr-2 text-primary-500" /> Filters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search subject or name..."
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">
            Complaints ({filteredComplaints.length})
          </h2>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No complaints found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredComplaints.map(complaint => (
                <div 
                  key={complaint._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedComplaint && selectedComplaint._id === complaint._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectComplaint(complaint)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-secondary-800">
                        {complaint.subject}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        From: {complaint.userName} ({complaint.userRole})
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
                        {complaint.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[complaint.priority]}`}>
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {complaint.description.substring(0, 100)}
                    {complaint.description.length > 100 ? '...' : ''}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Submitted: {formatDate(complaint.createdAt)}</span>
                    {complaint.adminResponse && (
                      <span className="flex items-center text-green-600">
                        <FaCheckCircle className="mr-1" /> Responded
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedComplaint && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            Complaint Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-secondary-800 mb-2">Subject</h3>
              <p className="text-gray-700 mb-4">{selectedComplaint.subject}</p>

              <h3 className="font-medium text-secondary-800 mb-2">Submitted By</h3>
              <p className="text-gray-700 mb-4">
                {selectedComplaint.userName} ({selectedComplaint.userRole})
                <br />
                {selectedComplaint.userEmail}
              </p>

              <div className="flex space-x-4 mb-4">
                <div>
                  <h3 className="font-medium text-secondary-800 mb-2">Status</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedComplaint.status]}`}>
                    {selectedComplaint.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-medium text-secondary-800 mb-2">Priority</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[selectedComplaint.priority]}`}>
                    {selectedComplaint.priority}
                  </span>
                </div>

                <div>
                  <h3 className="font-medium text-secondary-800 mb-2">Category</h3>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-800">
                    {selectedComplaint.category}
                  </span>
                </div>
              </div>

              <h3 className="font-medium text-secondary-800 mb-2">Submitted On</h3>
              <p className="text-gray-700">{formatDate(selectedComplaint.createdAt)}</p>

              <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="font-medium text-secondary-800 mb-3">Update Status Only</h3>
                <div className="flex items-center">
                  <select
                    value={statusUpdateOnly}
                    onChange={(e) => setStatusUpdateOnly(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md mr-3"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={updating || statusUpdateOnly === selectedComplaint.status}
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        Update Status
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <FaExclamationTriangle className="inline mr-1 text-yellow-500" />
                  This will only update the status without adding a response
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-secondary-800 mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-md text-gray-700 mb-6 max-h-40 overflow-y-auto">
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.adminResponse ? (
                <div>
                  <h3 className="font-medium text-secondary-800 mb-2">Admin Response</h3>
                  <div className="bg-green-50 p-4 rounded-md text-gray-700 border border-green-100">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedComplaint.adminResponse.text}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Responded on: {formatDate(selectedComplaint.adminResponse.respondedAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitResponse}>
                  <h3 className="font-medium text-secondary-800 mb-2">Respond to Complaint</h3>

                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md mb-3"
                    required
                  ></textarea>

                  <div className="flex items-center mb-4">
                    <label className="mr-4 text-sm font-medium text-gray-700">Mark as:</label>
                    <select
                      value={resolveStatus}
                      onChange={(e) => setResolveStatus(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                    >
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaReply className="mr-2" />
                        Submit Response
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;
