import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import { toast } from 'react-toastify';

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        // Use real API endpoint instead of mock data
        const token = localStorage.getItem('token');
        const response = await fetch('http://192.168.35.107:5000/admin/teacher', {
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
        console.log('Teachers data:', data);
        
        // Ensure that all teachers have the required properties
        const formattedTeachers = data.map(teacher => ({
          ...teacher,
          _id: teacher._id || '', // Ensure _id exists
          subjects: teacher.subjects || [],
          classTeacher: teacher.classTeacher || null
        }));
        setTeachers(formattedTeachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast.error(`Failed to load teachers data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  const handleEdit = (id) => {
    navigate(`/admin/teachers/edit/${id}`);
  };
  
  const handleDelete = (id) => {
    setDeleteModal({ open: true, id });
  };
  
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://192.168.35.107:5000/admin/teacher/${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      setTeachers(teachers.filter(teacher => teacher._id !== deleteModal.id));
      toast.success('Teacher deleted successfully');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(`Failed to delete teacher: ${error.message}`);
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };
  
  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'subjects',
      label: 'Subjects',
      sortable: false,
      render: (teacher) => (
        <div>
          {teacher.subjects.map((subject, index) => (
            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
              {`${subject.subject} (${subject.class}-${subject.division})`}
            </span>
          ))}
        </div>
      )
    },
    { 
      key: 'classTeacher',
      label: 'Class Teacher',
      render: (teacher) => 
        teacher.classTeacher ? 
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {`Class ${teacher.classTeacher.class}-${teacher.classTeacher.division}`}
          </span> : 
          <span className="text-gray-400">-</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (teacher) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(teacher._id)}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <FaEdit size={18} />
          </button>
          <button
            onClick={() => handleDelete(teacher._id)}
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
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Manage Teachers</h1>
      
      <DataTable
        columns={columns}
        data={teachers}
        title="Teacher List"
        actions={
          <Link
            to="/admin/teachers/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FaPlus className="-ml-1 mr-2 h-4 w-4" />
            Add Teacher
          </Link>
        }
        emptyMessage="No teachers found. Add a new teacher to get started."
      />
      
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone, and all associated data will be permanently removed."
      />
    </div>
  );
};

export default TeacherList;
