import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import AuthCard from '../../components/ui/AuthCard';
import FormField from '../../components/ui/FormField';
import AuthButton from '../../components/ui/AuthButton';
import Footer from '../../components/ui/Footer';
import { FaUserShield, FaChalkboardTeacher, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'parent'  
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
    <div className="min-h-screen flex flex-col bg-sand">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <AuthCard 
          title="R.I. Vidya Mandir Portal" 
          subtitle="Sign in to access the school management system"
          footer={
            <p>
              Forgot your password?{' '}
              <Link to="/forgot-password" className="text-primary-600 hover:underline font-medium">
                Reset it here
              </Link>
            </p>
          }
        >
          <h2 className="text-xl font-semibold text-secondary-800 mb-6">Login to your account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-between bg-sand rounded-lg p-1">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex items-center justify-center py-2 px-3 rounded text-sm font-medium transition-colors w-1/3 ${
                    formData.role === option.value
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleChange({ target: { name: 'role', value: option.value } })}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
            
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
                placeholder="Enter your password"
                required
                error={errors.password}
                className="pl-10"
              />
            </div>
            
            <div className="pt-3">
              <AuthButton type="submit" loading={loading}>
                Sign In
              </AuthButton>
            </div>
          </form>
        </AuthCard>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
