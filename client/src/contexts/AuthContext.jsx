import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { initiateSocket, disconnectSocket } from '../services/socketService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in by token in localStorage
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Determine user role based on stored role
        const storedRole = localStorage.getItem('userRole');
        
        if (storedRole) {
          setUser({ role: storedRole });
          // Initialize socket connection for authenticated user
          initiateSocket();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
    
    // Clean up socket connection on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const login = async (email, password, role) => {
    try {
      let endpoint = '';
      
      switch(role) {
        case 'admin':
          endpoint = 'http://192.168.35.107:5000/admin/login';
          break;
        case 'teacher':
          endpoint = 'http://192.168.35.107:5000/teacher/login';
          break;
        case 'parent':
          endpoint = 'http://192.168.35.107:5000/parent/login';
          break;
        default:
          throw new Error('Invalid role');
      }
      
      const response = await axios.post(endpoint, { email, password });
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      
      setUser({ role });
      
      // Initialize socket connection after successful login
      initiateSocket();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    }
  };

  const registerAdmin = async (email, password, adminKey) => {
    try {
      const response = await axios.post('http://192.168.35.107:5000/admin/register', { 
        email, 
        password,
        adminKey
      });
      
      return { 
        success: true,
        message: response.data.message || 'Admin registered successfully' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    // Disconnect socket before logout
    disconnectSocket();
    
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    registerAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
