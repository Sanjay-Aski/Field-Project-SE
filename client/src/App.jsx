import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/auth/Login';
import AdminRegister from './pages/auth/AdminRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import AdminLayout from './components/layouts/AdminLayout';
import TeacherLayout from './components/layouts/TeacherLayout';
import AdminDashboard from './pages/admin/Dashboard';
import TeacherList from './pages/admin/teachers/TeacherList';
import TeacherForm from './pages/admin/teachers/TeacherForm';
import ParentList from './pages/admin/parents/ParentList';
import ParentForm from './pages/admin/parents/ParentForm';
import StudentList from './pages/admin/students/StudentList';
import DonationList from './pages/admin/donations/DonationList';
import TeacherDashboard from './pages/teacher/Dashboard';
import ClassroomView from './pages/teacher/ClassroomView';
import ParentDashboard from './pages/parent/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentFormSlim from './pages/admin/students/StudentFormSlim';
import Navbar from './components/ui/Navbar';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-sand">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
              <Navbar />
              <LandingPage />
            </>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="teachers" element={<TeacherList />} />
            <Route path="teachers/add" element={<TeacherForm />} />
            <Route path="teachers/edit/:id" element={<TeacherForm />} />
            <Route path="parents" element={<ParentList />} />
            <Route path="parents/add" element={<ParentForm />} />
            <Route path="parents/edit/:id" element={<ParentForm />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/add" element={<StudentFormSlim />} />
            <Route path="students/edit/:id" element={<StudentFormSlim />} />
            <Route path="donations" element={<DonationList />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
          
          {/* Protected Teacher Routes */}
          <Route 
            path="/teacher/*" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classroom/:classId/:division" element={<ClassroomView />} />
            <Route path="classes" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="attendance" element={<div className="p-4">Attendance Management Page</div>} />
            <Route path="marksheets" element={<div className="p-4">Marksheets Management Page</div>} />
            <Route path="forms" element={<div className="p-4">Forms Management Page</div>} />
            <Route path="chat" element={<div className="p-4">Parent Chat Page</div>} />
            <Route path="analytics" element={<div className="p-4">Analytics Page</div>} />
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          </Route>
          
          {/* Protected Parent Routes */}
          <Route 
            path="/parent/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
