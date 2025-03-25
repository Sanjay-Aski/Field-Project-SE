import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import AuthCard from '../../components/ui/AuthCard';
import FormField from '../../components/ui/FormField';
import AuthButton from '../../components/ui/AuthButton';
import { FaLock } from 'react-icons/fa';

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
      title="Register as Admin" 
      subtitle="Create a new administrator account"
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Login here
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          error={errors.email}
        />
        
        <FormField
          label="Password"
          type="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
          error={errors.password}
        />
        
        <FormField
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          error={errors.confirmPassword}
        />
        
        <div className="relative">
          <FormField
            label="Admin Key"
            type="password"
            id="adminKey"
            value={formData.adminKey}
            onChange={handleChange}
            placeholder="Enter the admin key"
            required
            error={errors.adminKey}
          />
          <div className="absolute right-3 top-9 text-gray-500">
            <FaLock />
          </div>
        </div>
        
        <div className="pt-2">
          <AuthButton type="submit" loading={loading}>
            Register Admin Account
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};

export default AdminRegister;
