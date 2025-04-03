import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSave, FaTimes, FaArrowLeft, FaUserGraduate } from 'react-icons/fa';

const StudentFormSlim = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);
  const [parents, setParents] = useState([]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    roll: '',
    class: '',
    division: '',
    gender: '',
    dob: '',
    parentId: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Fetch student data if in edit mode, and fetch all parents
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://192.168.35.107:5000/admin/parent', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        setParents(data);
      } catch (error) {
        console.error('Error fetching parents:', error);
        toast.error(`Failed to load parents: ${error.message}`);
      }
    };
    
    const fetchStudent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://192.168.35.107:5000/admin/student/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching student:', error);
        toast.error(`Failed to load student data: ${error.message}`);
        navigate('/admin/students');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParents();
    fetchStudent();
  }, [id, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'roll' || name === 'class' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }
    
    if (!formData.roll) {
      newErrors.roll = 'Roll number is required';
    }
    
    if (!formData.class) {
      newErrors.class = 'Class is required';
    }
    
    if (!formData.division) {
      newErrors.division = 'Division is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }
    
    if (!formData.parentId) {
      newErrors.parentId = 'Parent is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (id) {
        // Update existing student
        const response = await fetch(`http://192.168.35.107:5000/admin/student/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        
        toast.success('Student updated successfully');
      } else {
        // Add new student
        const response = await fetch('http://192.168.35.107:5000/admin/student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        
        toast.success('Student added successfully');
      }
      
      navigate('/admin/students');
    } catch (error) {
      console.error('Error saving student:', error);
      setSubmitting(false);
      toast.error(`Failed to ${id ? 'update' : 'add'} student: ${error.message}`);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  const classes = Array.from({ length: 12 }, (_, i) => i + 1);
  const divisions = ['A', 'B', 'C', 'D', 'E'];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          {id ? 'Edit Student' : 'Add New Student'}
        </h1>
        
        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" /> Back to List
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="col-span-2">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Student Information</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="roll"
                  value={formData.roll}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.roll ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.roll && <p className="mt-1 text-sm text-red-500">{errors.roll}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.class ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
                {errors.class && <p className="mt-1 text-sm text-red-500">{errors.class}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division <span className="text-red-500">*</span></label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.division ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Division</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>Division {d}</option>
                  ))}
                </select>
                {errors.division && <p className="mt-1 text-sm text-red-500">{errors.division}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob ? formData.dob.substring(0, 10) : ''}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.dob ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dob && <p className="mt-1 text-sm text-red-500">{errors.dob}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent <span className="text-red-500">*</span></label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.parentId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Parent</option>
                  {parents.map(parent => (
                    <option key={parent._id} value={parent._id}>
                      {parent.fullName} ({parent.email})
                    </option>
                  ))}
                </select>
                {errors.parentId && <p className="mt-1 text-sm text-red-500">{errors.parentId}</p>}
              </div>
            </div>
            
            {/* Submit buttons */}
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/students')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={submitting}
              >
                <FaTimes className="mr-2" /> Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={submitting}
              >
                <FaSave className="mr-2" /> {submitting ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentFormSlim;
