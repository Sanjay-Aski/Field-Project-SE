import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrashAlt, FaChild, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import { toast } from 'react-toastify';

const ParentList = () => {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [viewDetails, setViewDetails] = useState(null);
  
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/admin/parent', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        const formattedParents = data.map(parent => ({
          ...parent,
          _id: parent._id || '',
          children: parent.children || []
        }));
        setParents(formattedParents);
      } catch (error) {
        toast.error(`Failed to load parents data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParents();
  }, []);
  
  const handleEdit = (id) => {
    navigate(`/admin/parents/edit/${id}`);
  };
  
  const handleDelete = (id) => {
    setDeleteModal({ open: true, id });
  };

  const handleView = (parent) => {
    setViewDetails(parent);
  };

  const closeViewModal = () => {
    setViewDetails(null);
  };
  
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/admin/parent/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      setParents(parents.filter(parent => parent._id !== deleteModal.id));
      toast.success('Parent deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete parent: ${error.message}`);
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };
  
  const columns = [
    { 
      key: 'fullName', 
      label: 'Name',
      render: (parent) => (
        <div className="font-medium text-gray-900">{parent.fullName}</div>
      )
    },
    { 
      key: 'contact', 
      label: 'Contact Information',
      sortable: false,
      render: (parent) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <FaEnvelope className="text-gray-400 mr-2" />
            <span className="text-gray-600">{parent.email}</span>
          </div>
          <div className="flex items-center text-sm">
            <FaPhone className="text-gray-400 mr-2" />
            <span className="text-gray-600">{parent.phoneNo}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'address', 
      label: 'Address', 
      render: (parent) => (
        <div className="flex items-start">
          <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1 flex-shrink-0" />
          <div className="text-sm text-gray-600 max-w-xs truncate" title={parent.address}>
            {parent.address}
          </div>
        </div>
      )
    },
    { 
      key: 'children',
      label: 'Children',
      sortable: false,
      render: (parent) => (
        <div>
          {parent.children && parent.children.length > 0 ? (
            <div className="space-y-2">
              {parent.children.slice(0, 2).map((child, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaChild className="text-blue-500 text-sm" />
                  </div>
                  <div className="ml-2 text-sm">
                    <div className="font-medium text-gray-900">{child.fullName}</div>
                    <div className="text-xs text-gray-500">Class {child.class}-{child.division} | Roll: {child.roll}</div>
                  </div>
                </div>
              ))}
              {parent.children.length > 2 && (
                <div className="text-xs text-gray-500 italic pl-9">
                  +{parent.children.length - 2} more children
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No children</span>
          )}
          <button 
            onClick={() => handleView(parent)} 
            className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
          >
            <FaEye className="mr-1" /> View All
          </button>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (parent) => (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(parent._id)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Edit"
          >
            <FaEdit size={18} />
          </button>
          <button
            onClick={() => handleDelete(parent._id)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete"
          >
            <FaTrashAlt size={18} />
          </button>
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
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Manage Parents</h1>
      
      <DataTable
        columns={columns}
        data={parents}
        title="Parent List"
        actions={
          <Link
            to="/admin/parents/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FaPlus className="-ml-1 mr-2 h-4 w-4" />
            Add Parent
          </Link>
        }
        emptyMessage="No parents found. Add a new parent to get started."
      />
      
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Parent"
        message="Are you sure you want to delete this parent? This action cannot be undone, and all associated data will be permanently removed. Children associated with this parent will also be removed."
      />

      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Parent Details</h2>
              <button 
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1">{viewDetails.fullName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{viewDetails.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                <p className="mt-1">{viewDetails.phoneNo}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-gray-700">{viewDetails.address}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Children</h3>
              {viewDetails.children && viewDetails.children.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class-Div</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewDetails.children.map((child) => (
                        <tr key={child._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{child.fullName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{child.class}-{child.division}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{child.roll}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{child.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No children associated with this parent</div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentList;
