import express from 'express';
import {
    registerAdmin,
    loginAdmin,
    addTeacher,
    removeTeacher,
    addParent,
    removeParent,
    addStudent,
    removeStudent,
    getAllDonations,
    getPendingDonations,
    assignDonation,
    rejectDonation,
    updateParent,
    updateTeacher,
    updateStudent,
    searchParents,
    searchTeachers,
    searchStudents,
    getTeacherById,
    getAllTeachers,
    getParentById,
    getAllParents,
    getStudentById,
    getAllStudents,
    getAllComplaints,
    getComplaintById,
    respondToComplaint,
    updateComplaintStatus
} from '../admin/admin_controller.js';

import authMiddleware from './admin_middleware.js';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/teacher', authMiddleware, addTeacher);
router.delete('/teacher/:id', authMiddleware, removeTeacher);
router.post('/parent', authMiddleware, addParent);
router.delete('/parent/:id', authMiddleware, removeParent);
router.post('/student', authMiddleware, addStudent);
router.delete('/student/:id', authMiddleware, removeStudent);
router.get('/donations', authMiddleware, getAllDonations);
router.get('/donations/pending', authMiddleware, getPendingDonations);
router.post('/donation/assign', authMiddleware, assignDonation);  // Change from '/donations/assign' to '/donation/assign'
router.post('/donation/reject', authMiddleware, rejectDonation);
router.put('/parent/:id', authMiddleware, updateParent);
router.put('/teacher/:id', authMiddleware, updateTeacher);
router.put('/student/:id', authMiddleware, updateStudent);
router.post('/search/parents', authMiddleware, searchParents);
router.post('/search/teachers', authMiddleware, searchTeachers); 
router.post('/search/students', authMiddleware, searchStudents); 

// Add these routes for teacher management
router.get('/teacher/:id', authMiddleware, getTeacherById);
router.get('/teacher', authMiddleware, getAllTeachers);

// Add these routes for parent management
router.get('/parent/:id', authMiddleware, getParentById);
router.get('/parent', authMiddleware, getAllParents);

// Add these routes for student management
router.get('/student/:id', authMiddleware, getStudentById);
router.get('/student', authMiddleware, getAllStudents);

// Add these routes for complaint management
router.get('/complaints', authMiddleware, getAllComplaints);
router.get('/complaints/:complaintId', authMiddleware, getComplaintById);
router.post('/complaints/:complaintId/respond', authMiddleware, respondToComplaint);
router.post('/complaints/:complaintId/update-status', authMiddleware, updateComplaintStatus);

export default router;