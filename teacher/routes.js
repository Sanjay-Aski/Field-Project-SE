import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
    login, 
    assignMarksheet, 
    setWorkingDays,
    assignAttendance, 
    getAttendance,
    getMarksheet, 
    getClassMarksheets,
    getFormAnalytics,
    giveNote, 
    acknowledgeNote, 
    giveForm, 
    getFormResponses, 
    getAttendanceReport,
    getClassStudents,
    sendMessageToParent,
    getChatHistory,
    acknowledgeMessages,
    getNotes,
    getSentForms,
    setWorkingDaysFromExcel,
    assignMarksheetFromExcel,
    assignAttendanceFromExcel,
    getTeacherProfile,
    submitComplaint,
    getParentContacts,
    getUnreadMessagesCount,
    getMarksheets,
    getMarksheetTemplate
} from './teacher_controller.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authentication route
router.post('/login', login);

// Teacher profile routes
router.get('/profile', auth, getTeacherProfile);

// Student management routes
router.get('/class-students', auth, getClassStudents);

// Marksheet routes
router.post('/assign-marksheet', auth, assignMarksheet);
router.get('/marksheet/:studentId', auth, getMarksheet);
router.get('/class-marksheets', auth, getClassMarksheets);
router.get('/marksheets', auth, getMarksheets);
router.post('/assign-marksheet-excel', auth, upload.single('file'), assignMarksheetFromExcel);
router.get('/marksheet-template', auth, getMarksheetTemplate);

// Attendance routes
router.post('/assign-attendance', auth, assignAttendance);
router.post('/attendance', auth, getAttendance);
router.get('/attendance-report/:studentId', auth, getAttendanceReport);
router.post('/assign-attendance-excel', auth, upload.single('file'), assignAttendanceFromExcel);
router.post('/set-working-days', auth, setWorkingDays);
router.post('/set-working-days-excel', auth, upload.single('file'), setWorkingDaysFromExcel);

// Communication routes
router.post('/give-note', auth, giveNote);
router.post('/acknowledge-note/:noteId', auth, acknowledgeNote);
router.get('/notes', auth, getNotes);
router.post('/send-message', auth, sendMessageToParent);
router.post('/get-chat-history', auth, getChatHistory);
router.post('/acknowledge-messages', auth, acknowledgeMessages);
router.get('/parent-contacts', auth, getParentContacts);
router.get('/unread-messages-count', auth, getUnreadMessagesCount);

// Forms routes
router.post('/give-form', auth, giveForm);
router.get('/get-form-responses/:formId', auth, getFormResponses);
router.get('/forms/analytics/:formId', auth, getFormAnalytics);
router.get('/sent-forms', auth, getSentForms);

// Complaint routes
router.post('/complaint', auth, submitComplaint);

export default router;