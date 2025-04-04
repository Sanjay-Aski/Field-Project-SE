import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEye, FaChartBar, FaCalendarAlt, FaUsers, FaSpinner, FaTrash, FaClipboardList } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FormsPage = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/teacher/sent-forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      
      if (data.success) {
        setForms(data.forms || []);
      } else {
        throw new Error(data.message || 'Failed to fetch forms');
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error(error.message || 'Failed to load forms');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteForm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/teacher/form/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete form');
      }

      setForms(forms.filter(form => form._id !== deleteId));
      toast.success('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(error.message || 'Failed to delete form');
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Forms Management</h1>
        <Link 
          to="/teacher/forms/create"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Create New Form
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-primary-600 text-3xl" />
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaClipboardList className="mx-auto text-gray-400 text-5xl mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Forms Created Yet</h2>
          <p className="text-gray-500 mb-6">Create your first form to gather information from parents.</p>
          <Link 
            to="/teacher/forms/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 inline-flex items-center"
          >
            <FaPlus className="mr-2" /> Create New Form
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-primary-50 border-b">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-900">{form.title}</h3>
                  <button 
                    onClick={() => handleDeleteClick(form._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{formatDate(form.createdAt)}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 mb-4 line-clamp-2">{form.description}</p>
                <div className="flex items-center mb-3">
                  {form.assignedTo === 'class' ? (
                    <div className="flex items-center text-sm text-blue-600">
                      <FaUsers className="mr-1" /> 
                      Class {form.class?.standard}-{form.class?.division}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-green-600">
                      <FaUsers className="mr-1" /> 
                      {form.studentIds?.length || 0} students
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-4">
                  <Link 
                    to={`/teacher/forms/view/${form._id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm flex items-center"
                  >
                    <FaEye className="mr-1" /> View
                  </Link>
                  <Link 
                    to={`/teacher/forms/analytics/${form._id}`}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm flex items-center"
                  >
                    <FaChartBar className="mr-1" /> Analytics
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this form? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteForm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsPage;
