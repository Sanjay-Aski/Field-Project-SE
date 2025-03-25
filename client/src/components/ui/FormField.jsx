import React from 'react';

const FormField = ({ 
  label, 
  type = 'text', 
  id, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  error = null,
  className = ''
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block mb-1 text-sm font-medium text-secondary-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
        } ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;
