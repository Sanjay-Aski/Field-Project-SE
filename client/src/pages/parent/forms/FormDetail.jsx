import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaPaperPlane, FaSpinner, FaClipboardCheck } from 'react-icons/fa';

const FormDetail = () => {
  const { studentId, formId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    fetchFormDetails();
  }, [studentId, formId]);
  
  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/parent/forms/${studentId}/${formId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch form: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setForm(data.form);
        
        // Initialize form responses
        const initialResponses = {};
        data.form.fields.forEach(field => {
          if (field.type === 'checkbox') {
            initialResponses[field.label] = [];
          } else {
            initialResponses[field.label] = '';
          }
        });
        
        setFormResponses(initialResponses);
      } else {
        toast.error(data.message || 'Failed to load form');
        navigate('/parent/forms/pending');
      }
    } catch (error) {
      console.error('Error fetching form details:', error);
      toast.error('Failed to load form');
      navigate('/parent/forms/pending');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (fieldLabel, value) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
    
    // Clear errors
    if (errors[fieldLabel]) {
      setErrors(prev => ({ ...prev, [fieldLabel]: null }));
    }
  };
  
  const handleCheckboxChange = (fieldLabel, option, checked) => {
    setFormResponses(prev => {
      const currentSelections = [...(prev[fieldLabel] || [])];
      
      if (checked) {
        return {
          ...prev,
          [fieldLabel]: [...currentSelections, option]
        };
      } else {
        return {
          ...prev,
          [fieldLabel]: currentSelections.filter(item => item !== option)
        };
      }
    });
    
    // Clear errors
    if (errors[fieldLabel]) {
      setErrors(prev => ({ ...prev, [fieldLabel]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    form.fields.forEach(field => {
      if (field.required) {
        if (field.type === 'checkbox') {
          if (!formResponses[field.label] || formResponses[field.label].length === 0) {
            newErrors[field.label] = 'This field is required';
          }
        } else if (!formResponses[field.label]) {
          newErrors[field.label] = 'This field is required';
        }
      }
      
      if (field.type === 'email' && formResponses[field.label] && !isValidEmail(formResponses[field.label])) {
        newErrors[field.label] = 'Please enter a valid email address';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Format answers for submission - ensure consistent data types
      const answers = Object.entries(formResponses).map(([field, value]) => {
        // Find the field definition to get its type
        const fieldDef = form.fields.find(f => f.label === field);
        
        // Return formatted answer
        return {
          field,
          value: value // The server will handle type conversion
        };
      });
      
      console.log('Submitting form with data:', { formId, studentId, answers });
      
      const response = await fetch(`http://localhost:5000/parent/forms/fill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId,
          studentId,
          answers
        })
      });
      
      // Try to get response text first, then parse as JSON if possible
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        responseData = { success: false, message: 'Invalid server response' };
      }
      
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Failed to submit form: ${response.status}`);
      }
      
      if (responseData.success) {
        toast.success('Form submitted successfully');
        navigate('/parent/forms/pending');
      } else {
        toast.error(responseData.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">Form not found or you don't have permission to access it.</p>
        <Link 
          to="/parent/forms/pending" 
          className="mt-4 inline-block text-primary-600 hover:text-primary-700"
        >
          <FaArrowLeft className="inline mr-2" />Back to Pending Forms
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{form.title}</h1>
        <div className="flex space-x-4">
          <Link to="/parent/forms/completed" className="text-green-600 hover:text-green-700">
            <FaClipboardCheck className="inline mr-2" />Completed Forms
          </Link>
          <Link to="/parent/forms/pending" className="text-primary-600 hover:text-primary-700">
            <FaArrowLeft className="inline mr-2" />Back to Pending Forms
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 bg-primary-50 border-b">
          <p className="text-gray-700">{form.description}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {form.fields.map((field, index) => (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors[field.label] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
              
              {field.type === 'email' && (
                <input
                  type="email"
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors[field.label] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
              
              {field.type === 'select' && (
                <select
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors[field.label] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  {field.options.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'radio' && (
                <div className="mt-2 space-y-2">
                  {field.options.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type="radio"
                        id={`${field.label}-${i}`}
                        name={field.label}
                        value={option}
                        checked={formResponses[field.label] === option}
                        onChange={() => handleInputChange(field.label, option)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor={`${field.label}-${i}`} className="ml-2 text-sm text-gray-700">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              {field.type === 'checkbox' && (
                <div className="mt-2 space-y-2">
                  {field.options.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${field.label}-${i}`}
                        value={option}
                        checked={(formResponses[field.label] || []).includes(option)}
                        onChange={(e) => handleCheckboxChange(field.label, option, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${field.label}-${i}`} className="ml-2 text-sm text-gray-700">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              
              {errors[field.label] && (
                <p className="mt-1 text-sm text-red-500">{errors[field.label]}</p>
              )}
            </div>
          ))}
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" />
                  Submit Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormDetail;
