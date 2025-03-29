import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrashAlt, FaChild } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import { toast } from 'react-toastify';

const ParentList = () => {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        // Use real API endpoint instead of mock data
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/admin/parent', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Parents data:', data);
        
        // Ensure that all parents have the required properties
        const formattedParents = data.map(parent => ({
          ...parent,
          _id: parent._id || '', // Ensure _id exists
          children: parent.children || []
        }));
        setParents(formattedParents);
      } catch (error) {
        console.error('Error fetching parents:', error);
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
      console.error('Error deleting parent:', error);
      toast.error(`Failed to delete parent: ${error.message}`);
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };
  
  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNo', label: 'Phone Number' },
    { key: 'address', label: 'Address', 
      render: (parent) => (
        <div className="truncate max-w-xs">{parent.address}</div>
      )
    },
    { 
      key: 'children',
      label: 'Children',
      sortable: false,
      render: (parent) => (
        <div>
          {parent.children.map((child, index) => (
            <div key={index} className="flex items-center mb-1 last:mb-0">
              <FaChild className="text-primary-400 mr-1" />
              <span className="text-sm">
                {child.fullName} (Class {child.class}-{child.division})
              </span>
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (parent) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(parent._id)}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <FaEdit size={18} />
          </button>
          <button
            onClick={() => handleDelete(parent._id)}
            className="text-red-600 hover:text-red-900"
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
    </div>
  );
};

export default ParentList;
