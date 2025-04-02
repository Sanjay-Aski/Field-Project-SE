import express from 'express';
import { parentAuthMiddleware } from './parents_middleware.js';
import {
    login,
    getChildren,
    getForms,
    getMarksheet,
    getAttendanceReport,
    sendNoteToTeacher,
    acknowledgeNote,
    getTeacherDetails,
    fillForm,
    sendMessageToTeacher,
    getChatHistory,
    acknowledgeMessages,
    getAllFormsNotFilled,
    getNotes,
    createDonation,
    getPendingDonations,
    applyForDonation,
    getParentProfile,
    submitComplaint,
    getUnreadMessageCount,
    getUnreadMessageCountAll,
    getMarksheetByExamType,
    getMarksheetExamTypes,
    getClassSubjects
} from './parents_controller.js';

const router = express.Router();

router.post('/login', login);
router.get('/children', parentAuthMiddleware, getChildren);
router.get('/forms/:studentId', parentAuthMiddleware, getForms);
router.get('/attendance/:studentId', parentAuthMiddleware, getAttendanceReport);
router.post('/note', parentAuthMiddleware, sendNoteToTeacher);
router.post('/note/acknowledge/:noteId', parentAuthMiddleware, acknowledgeNote);
router.get('/teacher-details/:studentId', parentAuthMiddleware, getTeacherDetails);
router.post('/form/fill', parentAuthMiddleware, fillForm);
router.post('/chat/send', parentAuthMiddleware, sendMessageToTeacher);
router.post('/chat/history', parentAuthMiddleware, getChatHistory);
router.post('/chat/acknowledge', parentAuthMiddleware, acknowledgeMessages);
router.post('/chat/unread-count', parentAuthMiddleware, getUnreadMessageCount);
router.post('/chat/unread-count-all', parentAuthMiddleware, getUnreadMessageCountAll);
router.get('/forms/not-filled', parentAuthMiddleware, getAllFormsNotFilled);
router.get('/notes', parentAuthMiddleware, getNotes);
router.post('/donation', parentAuthMiddleware, createDonation);
router.get('/donations/pending', parentAuthMiddleware, getPendingDonations);
router.post('/donation/:donationId/apply', parentAuthMiddleware, applyForDonation);
router.get('/profile', parentAuthMiddleware, getParentProfile);
router.post('/support/complaint', parentAuthMiddleware, submitComplaint);

// Add this new route before the marksheet routes
router.post('/class-subjects', parentAuthMiddleware, getClassSubjects);

// Make sure these routes are defined in this specific order
router.get('/marksheet/exams/:studentId', parentAuthMiddleware, getMarksheetExamTypes);
router.get('/marksheet/:studentId/:examType', parentAuthMiddleware, getMarksheetByExamType);
router.get('/marksheet/:studentId', parentAuthMiddleware, getMarksheet);

export default router;