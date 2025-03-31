import express from 'express';
import { parentAuthMiddleware } from './parents_middleware.js';
import {
    login,
    getChildren,
    fillForm,
    getForms,
    getMarksheet,
    getAttendanceReport,
    sendNoteToTeacher,
    acknowledgeNote,
    getTeacherDetails,
    sendMessageToTeacher, 
    getChatHistory,
    acknowledgeMessages,
    createDonation,
    getPendingDonations,
    applyForDonation,
    getAllFormsNotFilled,
    getNotes,
    getParentProfile,
    submitComplaint
} from './parents_controller.js';

const router = express.Router();

// Authentication routes
router.post('/login', login);

// Profile routes
router.get('/profile', parentAuthMiddleware, getParentProfile);
router.get('/children', parentAuthMiddleware, getChildren);

// Academic routes
router.get('/marksheet/:studentId', parentAuthMiddleware, getMarksheet);
router.get('/attendance/:studentId', parentAuthMiddleware, getAttendanceReport);

// Communication routes
router.post('/note', parentAuthMiddleware, sendNoteToTeacher);
router.post('/acknowledge-note/:noteId', parentAuthMiddleware, acknowledgeNote);
router.get('/notes', parentAuthMiddleware, getNotes);
router.get('/teacher-details/:studentId', parentAuthMiddleware, getTeacherDetails);

// Chat routes
router.post('/chat/send', parentAuthMiddleware, sendMessageToTeacher);
router.post('/chat/history', parentAuthMiddleware, getChatHistory);
router.post('/chat/acknowledge', parentAuthMiddleware, acknowledgeMessages);

// Forms routes
router.get('/forms/:studentId', parentAuthMiddleware, getForms);
router.post('/fill-form', parentAuthMiddleware, fillForm);
router.get('/forms/not-filled', parentAuthMiddleware, getAllFormsNotFilled);

// Donation routes
router.post('/donation', parentAuthMiddleware, createDonation);
router.get('/donations/pending', parentAuthMiddleware, getPendingDonations);
router.post('/donation/:donationId/apply', parentAuthMiddleware, applyForDonation);

// Support routes
router.post('/support/complaint', parentAuthMiddleware, submitComplaint);

export default router;