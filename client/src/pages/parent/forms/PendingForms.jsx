import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaClipboardList, FaCheck, FaClipboardCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PendingForms = () => {
  const [loading, setLoading] = useState(true);
  const [pendingForms, setPendingForms] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchPendingForms(selectedChild);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/parent/children', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch children: ${response.status}`);
      }
      
      const data = await response.json();
      setChildren(data);
      
      if (data.length > 0) {
        setSelectedChild(data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load children data');
      setLoading(false);
    }
  };

  const fetchPendingForms = async (childId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/parent/forms/not-filled`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending forms: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter forms for the selected child
        const filteredForms = data.forms.filter(form => {
          // If the form is assigned to a specific student
          if (form.assignedTo === 'specific') {
            return form.students.some(student => student._id === childId);
          }
          
          // If the form is assigned to a class, find the child's class and division
          const child = children.find(child => child._id === childId);
          if (child && form.class) {
            return form.class.standard === child.class && form.class.division === child.division;
          }
          
          return false;
        });
        
        setPendingForms(filteredForms);
      } else {
        setPendingForms([]);
      }
    } catch (error) {
      console.error('Error fetching pending forms:', error);
      toast.error('Failed to load pending forms');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (e) => {
    setSelectedChild(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pending Forms</h1>
        <div className="flex space-x-4">
          <Link to="/parent/forms/completed" className="text-primary-600 hover:text-primary-700">
            <FaClipboardCheck className="inline mr-2" />View Completed Forms
          </Link>
          <Link to="/parent/dashboard" className="text-primary-600 hover:text-primary-700">
            <FaArrowLeft className="inline mr-2" />Back to Dashboard
          </Link>
        </div>
      </div>

      {children.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg font-medium text-gray-900">Select Child</h2>
                <p className="text-sm text-gray-500">View pending forms for a specific child</p>
              </div>
              <div className="w-full md:w-1/3">
                <select
                  value={selectedChild || ''}
                  onChange={handleChildChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {children.map(child => (
                    <option key={child._id} value={child._id}>
                      {child.fullName} (Class {child.class}-{child.division})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : pendingForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingForms.map(form => (
                <div key={form._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b bg-primary-50">
                    <h3 className="font-medium text-lg text-gray-900">{form.title}</h3>
                    <span className="text-xs text-gray-500">Created: {formatDate(form.createdAt)}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-4">{form.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        <FaClipboardList className="inline mr-1" /> 
                        {form.fields.length} question{form.fields.length !== 1 ? 's' : ''}
                      </span>
                      <Link 
                        to={`/parent/forms/${selectedChild}/${form._id}`} 
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Fill Form <FaCheck className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FaClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No pending forms found for this child.</p>
              <p className="text-gray-400 mt-2">All forms have been completed or no forms have been assigned yet.</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No children found in your account.</p>
          <p className="text-gray-400 mt-2">Please contact the administrator if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
};

export default PendingForms;
