import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaTimes, FaArrowLeft, FaPlus, FaTrashAlt } from 'react-icons/fa';

const TeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    subjects: [],
    classTeacher: {
      class: '',
      division: ''
    }
  });
  
  const [errors, setErrors] = useState({});
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  
  // Fetch teacher data if in edit mode
  useEffect(() => {
    if (id) {
      const fetchTeacher = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          
          // Add endpoint to get a teacher by ID in admin_controller.js and admin_route.js
          const response = await fetch(`http://192.168.35.107:5000/admin/teacher/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          const data = await response.json();
          
          setFormData({
            ...data,
            password: ''
          });
          
          setIsClassTeacher(!!data.classTeacher);
        } catch (error) {
          console.error('Error fetching teacher:', error);
          toast.error(`Failed to load teacher data: ${error.message}`);
          navigate('/admin/teachers');
        } finally {
          setLoading(false);
        }
      };
      
      fetchTeacher();
    }
  }, [id, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('classTeacher.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        classTeacher: {
          ...prev.classTeacher,
          [field]: field === 'class' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleToggleClassTeacher = (e) => {
    const { checked } = e.target;
    setIsClassTeacher(checked);
    
    if (checked) {
      // Ensure classTeacher is properly initialized when enabling
      setFormData(prev => ({
        ...prev,
        classTeacher: { class: '', division: '' }
      }));
    } else {
      // Reset when disabling
      setFormData(prev => ({
        ...prev,
        classTeacher: { class: '', division: '' }
      }));
    }
  };
  
  const handleAddSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { class: '', division: '', subject: '' }]
    }));
  };
  
  const handleRemoveSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubjectChange = (index, field, value) => {
    setFormData(prev => {
      const newSubjects = [...prev.subjects];
      newSubjects[index] = {
        ...newSubjects[index],
        [field]: field === 'class' ? Number(value) : value
      };
      return { ...prev, subjects: newSubjects };
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!id && !formData.password.trim()) {
      newErrors.password = 'Password is required for new teachers';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate subjects
    if (formData.subjects.length === 0) {
      newErrors.subjects = 'At least one subject must be assigned';
    } else {
      formData.subjects.forEach((subject, index) => {
        if (!subject.class) {
          newErrors[`subjects[${index}].class`] = 'Class is required';
        }
        if (!subject.division) {
          newErrors[`subjects[${index}].division`] = 'Division is required';
        }
        if (!subject.subject) {
          newErrors[`subjects[${index}].subject`] = 'Subject is required';
        }
      });
    }
    
    // Validate class teacher if checked
    if (isClassTeacher) {
      if (!formData.classTeacher.class) {
        newErrors['classTeacher.class'] = 'Class is required';
      }
      if (!formData.classTeacher.division) {
        newErrors['classTeacher.division'] = 'Division is required';
      }
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
      // Prepare data for submission
      const teacherData = { ...formData };
      
      // Remove class teacher if not assigned
      if (!isClassTeacher) {
        teacherData.classTeacher = null;
      }
      
      const token = localStorage.getItem('token');
      
      if (id) {
        // Update existing teacher
        const response = await fetch(`http://192.168.35.107:5000/admin/teacher/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(teacherData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        
        toast.success('Teacher updated successfully');
      } else {
        // Add new teacher
        const response = await fetch('http://192.168.35.107:5000/admin/teacher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(teacherData)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
        
        toast.success('Teacher added successfully');
      }
      
      navigate('/admin/teachers');
    } catch (error) {
      console.error('Error saving teacher:', error);
      setSubmitting(false);
      toast.error(`Failed to ${id ? 'update' : 'add'} teacher: ${error.message}`);
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
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Studies', 'Computer Science'];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          {id ? 'Edit Teacher' : 'Add New Teacher'}
        </h1>
        
        <button
          onClick={() => navigate('/admin/teachers')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" /> Back to List
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Information */}
              <div className="col-span-2">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Basic Information</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!id && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={id ? 'Leave blank to keep current password' : 'Enter password'}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>
              
              {/* Class Teacher Assignment */}
              <div className="col-span-2 mt-4">
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Class Teacher Assignment</h2>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isClassTeacher"
                    checked={isClassTeacher}
                    onChange={handleToggleClassTeacher}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isClassTeacher" className="ml-2 block text-sm text-gray-700">
                    Assign as Class Teacher
                  </label>
                </div>
                
                {isClassTeacher && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                      <select
                        name="classTeacher.class"
                        value={formData.classTeacher.class}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                          errors['classTeacher.class'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                      {errors['classTeacher.class'] && (
                        <p className="mt-1 text-sm text-red-500">{errors['classTeacher.class']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Division <span className="text-red-500">*</span></label>
                      <select
                        name="classTeacher.division"
                        value={formData.classTeacher.division}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                          errors['classTeacher.division'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Division</option>
                        {divisions.map(d => (
                          <option key={d} value={d}>Division {d}</option>
                        ))}
                      </select>
                      {errors['classTeacher.division'] && (
                        <p className="mt-1 text-sm text-red-500">{errors['classTeacher.division']}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Subject Assignments */}
              <div className="col-span-2 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-secondary-800">Subject Assignments</h2>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FaPlus className="mr-1" /> Add Subject
                  </button>
                </div>
                
                {errors.subjects && <p className="mb-2 text-sm text-red-500">{errors.subjects}</p>}
                
                {formData.subjects.length === 0 ? (
                  <div className="p-4 bg-gray-50 text-center rounded-md">
                    <p className="text-gray-500">No subjects assigned. Click "Add Subject" to assign subjects.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between mb-3">
                          <h3 className="font-medium">Subject {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                            <select
                              value={subject.class}
                              onChange={(e) => handleSubjectChange(index, 'class', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`subjects[${index}].class`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Class</option>
                              {classes.map(c => (
                                <option key={c} value={c}>Class {c}</option>
                              ))}
                            </select>
                            {errors[`subjects[${index}].class`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`subjects[${index}].class`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Division <span className="text-red-500">*</span></label>
                            <select
                              value={subject.division}
                              onChange={(e) => handleSubjectChange(index, 'division', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`subjects[${index}].division`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Division</option>
                              {divisions.map(d => (
                                <option key={d} value={d}>Division {d}</option>
                              ))}
                            </select>
                            {errors[`subjects[${index}].division`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`subjects[${index}].division`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                            <select
                              value={subject.subject}
                              onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`subjects[${index}].subject`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Subject</option>
                              {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            {errors[`subjects[${index}].subject`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`subjects[${index}].subject`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Submit buttons */}
            <div className="flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/teachers')}
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
                <FaSave className="mr-2" /> {submitting ? 'Saving...' : 'Save Teacher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
