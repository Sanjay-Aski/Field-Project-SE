import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/auth/Login';
import AdminRegister from './pages/auth/AdminRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import AdminLayout from './components/layouts/AdminLayout';
import TeacherLayout from './components/layouts/TeacherLayout';
import ParentLayout from './components/layouts/ParentLayout';
import SupportLayout from './components/layouts/SupportLayout';
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
import ParentProfile from './pages/parent/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentFormSlim from './pages/admin/students/StudentFormSlim';
import Navbar from './components/ui/Navbar';
import ComplaintForm from './pages/support/ComplaintForm';
import FAQ from './pages/support/FAQ';
import FeedbackForm from './pages/support/FeedbackForm';
import HelpCenter from './pages/support/HelpCenter';
import ComplaintList from './pages/admin/complaints/ComplaintList';
import TeacherChatPage from './pages/teacher/chat/TeacherChatPage';
import ParentChatPage from './pages/parent/chat/ParentChatPage';
import AttendanceEntryPage from './pages/teacher/attendance/AttendanceEntryPage';
import StudentAttendance from './pages/parent/attendance/StudentAttendance';
import MarksheetEntry from './pages/teacher/marksheet/MarksheetEntry'; // Updated path
import MarksheetView from './pages/parent/marksheet/MarksheetView'; // Updated path
import MarksheetPage from './pages/teacher/marksheet/MarksheetPage';
import MarksheetDetail from './pages/teacher/marksheet/MarksheetDetail';
import StudentMarksheet from './pages/parent/marksheet/StudentMarksheet'; // Import StudentMarksheet

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
          
          {/* Public Support Routes */}
          <Route path="/support" element={<SupportLayout />}>
            <Route index element={<HelpCenter />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="complaint" element={<ComplaintForm />} />
            <Route path="feedback" element={<FeedbackForm />} />
          </Route>
          
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
            <Route path="complaints" element={<ComplaintList />} />
            <Route path="support/complaint" element={<ComplaintForm />} />
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
            <Route path="attendance" element={<AttendanceEntryPage />} />
            <Route path="marksheets" element={<MarksheetPage />} />
            <Route path="marksheets/:id" element={<MarksheetView />} />
            <Route path="marksheet/create" element={<MarksheetEntry />} /> {/* Move this route before the dynamic route */}
            <Route path="marksheet/:studentId" element={<MarksheetDetail />} />
            <Route path="forms" element={<div className="p-4">Forms Management Page</div>} />
            <Route path="chat" element={<TeacherChatPage />} />
            <Route path="analytics" element={<div className="p-4">Analytics Page</div>} />
            <Route path="support/complaint" element={<ComplaintForm />} />
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          </Route>
          
          {/* Protected Parent Routes */}
          <Route 
            path="/parent/*" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="profile" element={<ParentProfile />} />
            <Route path="children" element={<div className="p-4">My Children Page</div>} />
            <Route path="attendance/:studentId" element={<StudentAttendance />} />
            <Route path="chat/:studentId?" element={<ParentChatPage />} />
            <Route path="forms/pending" element={<div className="p-4">Pending Forms Page</div>} />
            <Route path="teachers" element={<div className="p-4">Teachers Page</div>} />
            <Route path="marksheet/:studentId" element={<StudentMarksheet />} /> {/* Updated route */}
            <Route path="support/complaint" element={<ComplaintForm />} />
            <Route index element={<Navigate to="/parent/dashboard" replace />} />
          </Route>
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
