import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const FormPreview = ({ form, onClose }) => {
  const [formResponses, setFormResponses] = useState({});

  const handleInputChange = (fieldLabel, value) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
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
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Form Preview</h1>
        <button 
          onClick={onClose}
          className="text-primary-600 hover:text-primary-700 flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Back to Editor
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 bg-primary-50 border-b">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{form.title}</h2>
          <p className="text-gray-600">{form.description}</p>
        </div>
        
        <div className="p-6">
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'textarea' && (
                <textarea
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                ></textarea>
              )}
              
              {field.type === 'number' && (
                <input
                  type="number"
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'email' && (
                <input
                  type="email"
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`Enter your email`}
                />
              )}
              
              {field.type === 'date' && (
                <input
                  type="date"
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              )}
              
              {field.type === 'select' && (
                <select
                  value={formResponses[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
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
            </div>
          ))}
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled
            >
              Submit Form (Preview Only)
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
        <p className="font-medium">Preview Mode</p>
        <p className="text-sm">This is a preview of how the form will appear to parents. Form submission is disabled in preview mode.</p>
      </div>
    </div>
  );
};

export default FormPreview;
