import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import AuthCard from '../../components/ui/AuthCard';
import FormField from '../../components/ui/FormField';
import AuthButton from '../../components/ui/AuthButton';
import { FaUserShield, FaChalkboardTeacher, FaUser } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'parent'  // Default role
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      const redirectPath = `/${user.role}/dashboard`;
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);
  
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { email, password, role } = formData;
      const result = await login(email, password, role);
      
      if (result.success) {
        toast.success(`Welcome back!`);
        navigate(`/${role}/dashboard`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const roleOptions = [
    { value: 'admin', label: 'Administrator', icon: <FaUserShield className="mr-1" /> },
    { value: 'teacher', label: 'Teacher', icon: <FaChalkboardTeacher className="mr-1" /> },
    { value: 'parent', label: 'Parent', icon: <FaUser className="mr-1" /> }
  ];
  
  return (
    <AuthCard 
      title="Login to SchoolTrack" 
      subtitle="Enter your credentials to access your account"
      footer={
        <>
          {formData.role === 'admin' && (
            <p>
              Don't have an admin account?{' '}
              <Link to="/admin/register" className="text-primary-600 hover:underline font-medium">
                Register here
              </Link>
            </p>
          )}
          <p className="mt-2">
            <Link to="/user/send-otp" className="text-primary-600 hover:underline text-sm">
              Forgot password?
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between bg-gray-100 rounded-lg p-1 mb-4">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`flex items-center justify-center py-2 px-3 rounded text-sm font-medium transition-colors w-1/3 ${
                formData.role === option.value
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => handleChange({ target: { name: 'role', value: option.value } })}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
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
        />
        
        <FormField
          label="Password"
          type="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          error={errors.password}
        />
        
        <div className="pt-2">
          <AuthButton type="submit" loading={loading}>
            Sign In
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};

export default Login;
