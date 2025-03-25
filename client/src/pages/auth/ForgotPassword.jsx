import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthCard from '../../components/ui/AuthCard';
import FormField from '../../components/ui/FormField';
import AuthButton from '../../components/ui/AuthButton';
import { FaEnvelope, FaKey, FaLock, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email entry, 2: OTP entry, 3: New password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [userType, setUserType] = useState('');

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

  const validateEmailForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpForm = () => {
    const newErrors = {};
    
    if (!formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!validateEmailForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/user/send-otp', { email: formData.email });
      
      if (response.data.success) {
        toast.success('OTP sent to your email address');
        setUserType(response.data.userType);
        setStep(2);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!validateOtpForm()) return;
    
    // Only move to next step, actual verification happens in final step
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/user/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      
      if (response.data.success) {
        toast.success('Password has been reset successfully');
        navigate('/login');
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <form onSubmit={handleSendOtp} className="space-y-5">
      <div className="relative">
        <div className="absolute left-3 top-9 text-gray-400">
          <FaEnvelope />
        </div>
        <FormField
          label="Email Address"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your registered email"
          required
          error={errors.email}
          className="pl-10"
        />
      </div>
      
      <div className="pt-3">
        <AuthButton type="submit" loading={loading}>
          Send OTP
        </AuthButton>
      </div>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-5">
      <div className="relative">
        <div className="absolute left-3 top-9 text-gray-400">
          <FaKey />
        </div>
        <FormField
          label="OTP Code"
          type="text"
          id="otp"
          name="otp"
          value={formData.otp}
          onChange={handleChange}
          placeholder="Enter 6-digit OTP"
          required
          error={errors.otp}
          className="pl-10"
        />
        <p className="text-xs text-secondary-500 mt-1">
          Please check your email for the OTP. It will expire in 2 minutes.
        </p>
      </div>
      
      <div className="flex space-x-4 pt-3">
        <button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-secondary-700 py-2 px-4 rounded-md flex items-center text-sm transition-colors"
          onClick={() => setStep(1)}
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
        <AuthButton type="submit" loading={loading} className="flex-1">
          Verify OTP
        </AuthButton>
      </div>
    </form>
  );

  const renderStepThree = () => (
    <form onSubmit={handleResetPassword} className="space-y-5">
      <div className="relative">
        <div className="absolute left-3 top-9 text-gray-400">
          <FaLock />
        </div>
        <FormField
          label="New Password"
          type="password"
          id="newPassword"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Create new password"
          required
          error={errors.newPassword}
          className="pl-10"
        />
      </div>
      
      <div className="relative">
        <div className="absolute left-3 top-9 text-gray-400">
          <FaLock />
        </div>
        <FormField
          label="Confirm New Password"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm new password"
          required
          error={errors.confirmPassword}
          className="pl-10"
        />
      </div>
      
      <div className="flex space-x-4 pt-3">
        <button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-secondary-700 py-2 px-4 rounded-md flex items-center text-sm transition-colors"
          onClick={() => setStep(2)}
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
        <AuthButton type="submit" loading={loading} className="flex-1">
          Reset Password
        </AuthButton>
      </div>
    </form>
  );

  const getStepContent = () => {
    switch (step) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      default:
        return renderStepOne();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Forgot Password";
      case 2:
        return "Verify OTP";
      case 3:
        return "Create New Password";
      default:
        return "Forgot Password";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return "Enter your email to receive a one-time password";
      case 2:
        return "Enter the 6-digit code sent to your email";
      case 3:
        return "Create a new secure password for your account";
      default:
        return "Enter your email to receive a one-time password";
    }
  };

  return (
    <AuthCard 
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      footer={
        <p>
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Back to login
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary-800 mb-2">
          {step === 1 && "Reset Your Password"}
          {step === 2 && "Verification Required"}
          {step === 3 && "Almost Done"}
        </h2>
        <p className="text-secondary-600 text-sm">
          {step === 1 && "We'll send a verification code to your email address"}
          {step === 2 && `A 6-digit code has been sent to ${formData.email}`}
          {step === 3 && "Choose a strong password that you haven't used before"}
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
                step >= i ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i}
              </div>
              {i < 3 && (
                <div className={`h-1 w-10 mx-1 ${
                  step > i ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {getStepContent()}
    </AuthCard>
  );
};

export default ForgotPassword;
