import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
        // In a real app, you would fetch actual data from your API
        // For now, let's create mock data
        setTimeout(() => {
          const mockParents = Array.from({ length: 20 }, (_, index) => ({
            _id: `p${index + 1}`,
            fullName: `Parent ${index + 1}`,
            email: `parent${index + 1}@example.com`,
            phoneNo: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            address: `Address ${index + 1}, Some City`,
            children: Array.from(
              { length: Math.floor(Math.random() * 3) + 1 }, 
              (_, i) => ({ 
                _id: `s${index}${i}`, 
                fullName: `Student ${index}${i}`, 
                class: Math.floor(Math.random() * 12) + 1,
                division: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
              })
            )
          }));
          
          setParents(mockParents);
          setLoading(false);
        }, 1000);
        
        // Uncomment below for actual API call
        /*
        const response = await axios.get('/api/admin/parents', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setParents(response.data);
        setLoading(false);
        */
      } catch (error) {
        console.error('Error fetching parents:', error);
        toast.error('Failed to load parents data');
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
      // In a real app, you would make an API call to delete the parent
      // For now, let's just update the state
      setParents(parents.filter(parent => parent._id !== deleteModal.id));
      toast.success('Parent deleted successfully');
      
      // Uncomment below for actual API call
      /*
      await axios.delete(`/api/admin/parent/${deleteModal.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setParents(parents.filter(parent => parent._id !== deleteModal.id));
      toast.success('Parent deleted successfully');
      */
    } catch (error) {
      console.error('Error deleting parent:', error);
      toast.error('Failed to delete parent');
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
