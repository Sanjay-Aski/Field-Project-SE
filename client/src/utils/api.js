import axios from 'axios';

// Create an axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000', // Replace with your backend URL if different
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Admin Teacher API calls
export const fetchTeachers = async () => {
  try {
    const response = await api.get('/api/admin/teachers');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addTeacher = async (teacherData) => {
  try {
    const response = await api.post('/api/admin/teacher', teacherData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTeacher = async (id, teacherData) => {
  try {
    const response = await api.put(`/api/admin/teacher/${id}`, teacherData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTeacher = async (id) => {
  try {
    const response = await api.delete(`/api/admin/teacher/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTeacher = async (id) => {
  try {
    const response = await api.get(`/api/admin/teacher/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Parent API calls
export const fetchParents = async () => {
  try {
    const response = await api.get('/api/admin/parents');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addParent = async (parentData) => {
  try {
    const response = await api.post('/api/admin/parent', parentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateParent = async (id, parentData) => {
  try {
    const response = await api.put(`/api/admin/parent/${id}`, parentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteParent = async (id) => {
  try {
    const response = await api.delete(`/api/admin/parent/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getParent = async (id) => {
  try {
    const response = await api.get(`/api/admin/parent/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Student API calls
export const fetchStudents = async () => {
  try {
    const response = await api.get('/api/admin/students');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Donation API calls
export const fetchDonations = async () => {
  try {
    const response = await api.get('/api/admin/donations');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchPendingDonations = async () => {
  try {
    const response = await api.get('/api/admin/donations/pending');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignDonation = async (donationData) => {
  try {
    const response = await api.post('/api/admin/donations/assign', donationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Admin Dashboard stats
export const fetchAdminStats = async () => {
  try {
    const response = await api.get('/api/admin/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Search functionality
export const searchParents = async (searchParams) => {
  try {
    const response = await api.post('/api/admin/search/parents', searchParams);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchTeachers = async (searchParams) => {
  try {
    const response = await api.post('/api/admin/search/teachers', searchParams);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchStudents = async (searchParams) => {
  try {
    const response = await api.post('/api/admin/search/students', searchParams);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
