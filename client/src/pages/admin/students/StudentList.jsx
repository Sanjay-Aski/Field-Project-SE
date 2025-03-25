import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUserGraduate, FaUsers, FaSearch } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import { toast } from 'react-toastify';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // In a real app, you would fetch actual data from your API
        // For now, let's create mock data
        setTimeout(() => {
          const mockStudents = Array.from({ length: 30 }, (_, index) => ({
            _id: `s${index + 1}`,
            fullName: `Student ${index + 1}`,
            roll: Math.floor(Math.random() * 50) + 1,
            class: Math.floor(Math.random() * 12) + 1,
            division: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
            gender: ['Male', 'Female'][Math.floor(Math.random() * 2)],
            dob: new Date(2000 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            parentId: {
              _id: `p${Math.floor(index / 2) + 1}`,
              fullName: `Parent ${Math.floor(index / 2) + 1}`,
              email: `parent${Math.floor(index / 2) + 1}@example.com`,
              phoneNo: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`
            }
          }));
          
          setStudents(mockStudents);
          setLoading(false);
        }, 1000);
        
        // Uncomment below for actual API call
        /*
        const response = await axios.get('/api/admin/students', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setStudents(response.data);
        setLoading(false);
        */
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students data');
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);
  
  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'roll', label: 'Roll No.' },
    { 
      key: 'class', 
      label: 'Class/Division',
      render: (student) => `${student.class}-${student.division}`
    },
    { key: 'gender', label: 'Gender' },
    { 
      key: 'dob', 
      label: 'Date of Birth',
      render: (student) => new Date(student.dob).toLocaleDateString()
    },
    { 
      key: 'parent', 
      label: 'Parent',
      sortable: false,
      render: (student) => (
        <div>
          <div className="font-medium">{student.parentId.fullName}</div>
          <div className="text-xs text-gray-500">{student.parentId.email}</div>
          <div className="text-xs text-gray-500">{student.parentId.phoneNo}</div>
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
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">All Students</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <FaUserGraduate size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-800">Manage Students</h2>
            <p className="text-gray-600">View all students and their information. Students are added through parent management.</p>
          </div>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={students}
        title="Student List"
        actions={
          <Link
            to="/admin/parents/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FaUsers className="mr-2" />
            Add Parent with Students
          </Link>
        }
        emptyMessage="No students found. Add parents with students to get started."
      />
    </div>
  );
};

export default StudentList;
