import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const ComplaintForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'technical',
    email: '',
    name: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    // Only validate email and name if user is not logged in
    if (!user) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the token if user is logged in
      const token = user ? localStorage.getItem('token') : null;
      
      // Choose the endpoint based on user role
      let endpoint = 'http://localhost:5000/support/complaint';
      
      if (user) {
        if (user.role === 'parent') {
          endpoint = 'http://localhost:5000/parent/support/complaint';
        } else if (user.role === 'teacher') {
          endpoint = 'http://localhost:5000/teacher/support/complaint';
        } else if (user.role === 'admin') {
          endpoint = 'http://localhost:5000/admin/support/complaint';
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...token ? { 'Authorization': `Bearer ${token}` } : {}
        },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          category: formData.category,
          ...(!user ? { name: formData.name, email: formData.email } : {})
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit complaint');
      }
      
      toast.success('Your complaint has been submitted successfully');
      
      // Redirect to appropriate page based on whether user is logged in
      if (user) {
        navigate(`/${user.role}/dashboard`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6 flex items-center text-secondary-800">
        <FaExclamationCircle className="text-primary-600 mr-3 text-xl" />
        <h1 className="text-2xl font-bold">Raise a Complaint</h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        Please provide details about your issue. Our support team will review and respond to your complaint as soon as possible.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Show name and email fields only if user is not logged in */}
        {!user && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              errors.subject ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief subject of your complaint"
          />
          {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="technical">Technical Issue</option>
            <option value="account">Account Access</option>
            <option value="data">Data/Information Error</option>
            <option value="feature">Feature Request</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Please provide detailed information about your complaint"
          ></textarea>
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane className="mr-2" />
                Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;
