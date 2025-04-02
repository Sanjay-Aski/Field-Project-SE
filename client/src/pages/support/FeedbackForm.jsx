import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaSmile, FaMeh, FaFrown } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    satisfaction: 'satisfied',
    category: 'portal',
    message: '',
    name: '',
    email: '',
    allowContact: true
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.message.trim()) {
      newErrors.message = 'Feedback message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Please provide more detailed feedback (at least 10 characters)';
    }
    
    if (!user) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
     
      const response = await fetch('http://localhost:5000/support/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...user ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}
        },
        body: JSON.stringify({
          ...formData,
          ...user ? { userRole: user.role, userId: user.id } : {}
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      toast.success('Thank you for your feedback!');
      
      if (user) {
        navigate(`/${user.role}/dashboard`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const satisfactionOptions = [
    { value: 'satisfied', label: 'Satisfied', icon: <FaSmile className="text-green-500 text-xl" /> },
    { value: 'neutral', label: 'Neutral', icon: <FaMeh className="text-yellow-500 text-xl" /> },
    { value: 'dissatisfied', label: 'Dissatisfied', icon: <FaFrown className="text-red-500 text-xl" /> }
  ];
  
  const categoryOptions = [
    { value: 'portal', label: 'Portal Experience' },
    { value: 'performance', label: 'System Performance' },
    { value: 'features', label: 'Features & Functionality' },
    { value: 'usability', label: 'Ease of Use' },
    { value: 'other', label: 'Other' }
  ];
  
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-800">Share Your Feedback</h1>
        <p className="text-gray-600 mt-2">
          We value your input! Please share your thoughts to help us improve.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Show name and email fields only if user is not logged in */}
        {!user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
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
                className={`w-full p-2 border rounded-md ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>
        )}
        
        {/* Satisfaction Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How satisfied are you with our service?
          </label>
          <div className="flex space-x-4">
            {satisfactionOptions.map(option => (
              <label 
                key={option.value} 
                className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.satisfaction === option.value 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {option.icon}
                <span className="mt-2 text-sm font-medium">{option.label}</span>
                <input
                  type="radio"
                  name="satisfaction"
                  value={option.value}
                  checked={formData.satisfaction === option.value}
                  onChange={handleChange}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>
        
        {/* Feedback Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What area are you providing feedback about?
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Feedback Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            className={`w-full p-2 border rounded-md ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Please share your thoughts, suggestions, or concerns..."
          ></textarea>
          {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
        </div>
        
        {/* Allow Contact Checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="allowContact"
              name="allowContact"
              type="checkbox"
              checked={formData.allowContact}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="allowContact" className="font-medium text-gray-700">
              May we contact you about your feedback if needed?
            </label>
          </div>
        </div>
        
        {/* Submit Button */}
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
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
