import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import AuthCard from '../../components/ui/AuthCard';
import FormField from '../../components/ui/FormField';
import AuthButton from '../../components/ui/AuthButton';
import { FaLock, FaEnvelope, FaKey, FaUserShield } from 'react-icons/fa';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    adminKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.adminKey) {
      newErrors.adminKey = 'Admin key is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { email, password, adminKey } = formData;
      const result = await registerAdmin(email, password, adminKey);
      
      if (result.success) {
        toast.success('Admin registered successfully!');
        navigate('/login');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthCard 
      title="Admin Registration" 
      subtitle="Create a new administrator account to manage school operations"
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Login here
          </Link>
        </p>
      }
    >
      <div className="flex items-center mb-6 bg-primary-50 p-3 rounded-md border-l-4 border-primary-500">
        <FaUserShield className="text-primary-600 mr-3 h-6 w-6" />
        <div>
          <h2 className="text-xl font-semibold text-secondary-800">Administrator Setup</h2>
          <p className="text-sm text-secondary-600">Complete the form below to create an admin account</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <div className="absolute left-3 top-9 text-gray-400">
            <FaEnvelope />
          </div>
          <FormField
            label="Email"
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            error={errors.email}
            className="pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute left-3 top-9 text-gray-400">
              <FaLock />
            </div>
            <FormField
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              error={errors.password}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-9 text-gray-400">
              <FaLock />
            </div>
            <FormField
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              error={errors.confirmPassword}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-9 text-gray-400">
            <FaKey />
          </div>
          <FormField
            label="Admin Key"
            type="password"
            id="adminKey"
            value={formData.adminKey}
            onChange={handleChange}
            placeholder="Enter the admin key"
            required
            error={errors.adminKey}
            className="pl-10"
          />
          <p className="text-xs text-secondary-500 mt-1">The admin key is required for security purposes</p>
        </div>
        
        <div className="pt-3">
          <AuthButton type="submit" loading={loading}>
            Register Admin Account
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};

export default AdminRegister;
