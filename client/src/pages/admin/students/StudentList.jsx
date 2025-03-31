import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaUsers, FaSearch } from 'react-icons/fa';
import DataTable from '../../../components/ui/DataTable';
import { toast } from 'react-toastify';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('http://192.168.103.107:5000/admin/student', {
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
        console.log('Students data:', data);
        
        // Format the student data
        const formattedStudents = await Promise.all(data.map(async (student) => {
          // Fetch parent information if parentId exists
          if (student.parentId) {
            try {
              const parentResponse = await fetch(`http://192.168.103.107:5000/admin/parent/${student.parentId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (parentResponse.ok) {
                const parentData = await parentResponse.json();
                return {
                  ...student,
                  parentId: {
                    _id: parentData._id,
                    fullName: parentData.fullName,
                    email: parentData.email,
                    phoneNo: parentData.phoneNo
                  }
                };
              }
            } catch (error) {
              console.error('Error fetching parent:', error);
            }
          }
          
          return student;
        }));
        
        setStudents(formattedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error(`Failed to load students data: ${error.message}`);
      } finally {
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
        student.parentId ? (
          <div>
            <div className="font-medium">{student.parentId.fullName}</div>
            <div className="text-xs text-gray-500">{student.parentId.email}</div>
            <div className="text-xs text-gray-500">{student.parentId.phoneNo}</div>
          </div>
        ) : (
          <span className="text-gray-400">No parent assigned</span>
        )
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
