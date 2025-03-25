import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaTimes, FaArrowLeft, FaUserGraduate, FaPlus, FaTrashAlt } from 'react-icons/fa';

const ParentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNo: '',
    address: ''
  });
  
  const [children, setChildren] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Fetch parent data if in edit mode
  useEffect(() => {
    if (id) {
      const fetchParent = async () => {
        try {
          // In a real app, you would fetch actual data from your API
          // For now, let's create mock data
          setTimeout(() => {
            const mockParent = {
              _id: id,
              fullName: `Parent ${id.slice(1)}`,
              email: `parent${id.slice(1)}@example.com`,
              phoneNo: `+91 9876543210`,
              address: `123 Main Street, City ${id.slice(1)}, State, 123456`,
              children: Array.from(
                { length: 2 }, 
                (_, i) => ({ 
                  _id: `s${id.slice(1)}${i}`, 
                  fullName: `Student ${id.slice(1)}${i}`,
                  roll: Math.floor(Math.random() * 50) + 1, 
                  class: Math.floor(Math.random() * 12) + 1,
                  division: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
                  gender: ['Male', 'Female'][Math.floor(Math.random() * 2)],
                  dob: '2010-05-15'
                })
              )
            };
            
            setFormData({
              ...mockParent,
              password: '' // Don't populate password field
            });
            
            setChildren(mockParent.children);
            setLoading(false);
          }, 800);
          
          // Uncomment below for actual API call
          /*
          const response = await axios.get(`/api/admin/parent/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setFormData({
            ...response.data,
            password: '' // Don't populate password field
          });
          
          setChildren(response.data.children);
          setLoading(false);
          */
        } catch (error) {
          console.error('Error fetching parent:', error);
          toast.error('Failed to load parent data');
          navigate('/admin/parents');
        }
      };
      
      fetchParent();
    }
  }, [id, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleChildChange = (index, field, value) => {
    setChildren(prev => {
      const updatedChildren = [...prev];
      updatedChildren[index] = {
        ...updatedChildren[index],
        [field]: field === 'class' || field === 'roll' ? Number(value) : value
      };
      return updatedChildren;
    });
    
    // Clear error when user starts typing
    const errorKey = `children[${index}].${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };
  
  const handleAddChild = () => {
    setChildren(prev => [
      ...prev,
      {
        _id: '',
        fullName: '',
        roll: '',
        class: '',
        division: '',
        gender: '',
        dob: ''
      }
    ]);
  };
  
  const handleRemoveChild = (index) => {
    setChildren(prev => prev.filter((_, i) => i !== index));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Basic parent info validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!id && !formData.password.trim()) {
      newErrors.password = 'Password is required for new parents';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.phoneNo.trim()) {
      newErrors.phoneNo = 'Phone number is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    // Validate children if any
    children.forEach((child, index) => {
      if (!child.fullName.trim()) {
        newErrors[`children[${index}].fullName`] = 'Child name is required';
      }
      
      if (!child.roll) {
        newErrors[`children[${index}].roll`] = 'Roll number is required';
      }
      
      if (!child.class) {
        newErrors[`children[${index}].class`] = 'Class is required';
      }
      
      if (!child.division) {
        newErrors[`children[${index}].division`] = 'Division is required';
      }
      
      if (!child.gender) {
        newErrors[`children[${index}].gender`] = 'Gender is required';
      }
      
      if (!child.dob) {
        newErrors[`children[${index}].dob`] = 'Date of birth is required';
      }
    });
    
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
      const parentData = { ...formData, children };
      
      // In a real app, you would make an API call to create/update the parent
      // For now, let's just simulate success
      setTimeout(() => {
        setSubmitting(false);
        toast.success(`Parent ${id ? 'updated' : 'added'} successfully`);
        navigate('/admin/parents');
      }, 1000);
      
      // Uncomment below for actual API call
      /*
      if (id) {
        await axios.put(`/api/admin/parent/${id}`, parentData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Parent updated successfully');
      } else {
        await axios.post('/api/admin/parent', parentData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Parent added successfully');
      }
      navigate('/admin/parents');
      */
    } catch (error) {
      console.error('Error saving parent:', error);
      setSubmitting(false);
      toast.error(`Failed to ${id ? 'update' : 'add'} parent`);
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
          {id ? 'Edit Parent' : 'Add New Parent'}
        </h1>
        
        <button
          onClick={() => navigate('/admin/parents')}
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
                <h2 className="text-xl font-semibold text-secondary-800 mb-4">Parent Information</h2>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.phoneNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phoneNo && <p className="mt-1 text-sm text-red-500">{errors.phoneNo}</p>}
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>
              
              {/* Children Information */}
              <div className="col-span-2 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-secondary-800">Children Information</h2>
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FaPlus className="mr-1" /> Add Child
                  </button>
                </div>
                
                {children.length === 0 ? (
                  <div className="p-4 bg-gray-50 text-center rounded-md">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FaUserGraduate className="h-10 w-10 mb-2 text-gray-400" />
                      <p>No children added yet. Click "Add Child" to add children for this parent.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {children.map((child, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between mb-3">
                          <h3 className="font-medium flex items-center">
                            <FaUserGraduate className="mr-2 text-primary-500" />
                            {child.fullName ? child.fullName : `Child ${index + 1}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={child.fullName}
                              onChange={(e) => handleChildChange(index, 'fullName', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`children[${index}].fullName`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`children[${index}].fullName`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`children[${index}].fullName`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              value={child.roll}
                              onChange={(e) => handleChildChange(index, 'roll', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`children[${index}].roll`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`children[${index}].roll`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`children[${index}].roll`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                            <select
                              value={child.class}
                              onChange={(e) => handleChildChange(index, 'class', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`children[${index}].class`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Class</option>
                              {classes.map(c => (
                                <option key={c} value={c}>Class {c}</option>
                              ))}
                            </select>
                            {errors[`children[${index}].class`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`children[${index}].class`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Division <span className="text-red-500">*</span></label>
                            <select
                              value={child.division}
                              onChange={(e) => handleChildChange(index, 'division', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`children[${index}].division`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Division</option>
                              {divisions.map(d => (
                                <option key={d} value={d}>Division {d}</option>
                              ))}
                            </select>
                            {errors[`children[${index}].division`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`children[${index}].division`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                            <select
                              value={child.gender}
                              onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`children[${index}].gender`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            {errors[`children[${index}].gender`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`children[${index}].gender`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              value={child.dob}
                              onChange={(e) => handleChildChange(index, 'dob', e.target.value)}
                              className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                                errors[`children[${index}].dob`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`children[${index}].dob`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`children[${index}].dob`]}</p>
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
                onClick={() => navigate('/admin/parents')}
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
                <FaSave className="mr-2" /> {submitting ? 'Saving...' : 'Save Parent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentForm;
