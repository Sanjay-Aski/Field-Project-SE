import express from 'express';
import { teacherAuthMiddleware, classTeacherAuthMiddleware, subjectTeacherAuthMiddleware, classTeacherAuthForClassMiddleware } from './teacher_middleware.js';
import { login, assignMarksheet, getMarksheet, getClassMarksheets, giveNote, acknowledgeNote, giveForm, getFormResponses, getAttendanceReport, getClassStudents, getChatHistory, sendMessageToParent, acknowledgeMessages, getNotes, getSentForms, getFormAnalytics, assignAttendance, setWorkingDays, getAttendance, setWorkingDaysFromExcel, assignAttendanceFromExcel, assignMarksheetFromExcel, getTeacherProfile, submitComplaint, getParentContacts, getUnreadMessagesCount, getMarksheets } from './teacher_controller.js';

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/login', login);

// Make sure the profile endpoint is registered correctly
router.get('/profile', teacherAuthMiddleware, getTeacherProfile);

router.post('/assign-marksheet', teacherAuthMiddleware, classTeacherAuthMiddleware, assignMarksheet);
router.get('/marksheet/:studentId', teacherAuthMiddleware, classTeacherAuthMiddleware, getMarksheet);
router.get('/class-marksheets', teacherAuthMiddleware, getClassMarksheets);
router.get('/marksheets', teacherAuthMiddleware, getMarksheets); // Add this explicit route for getMarksheets

// Update attendance routes to use classTeacherAuthForClassMiddleware
router.post('/assign-attendance', teacherAuthMiddleware, classTeacherAuthForClassMiddleware, assignAttendance);
router.post('/set-working-days', teacherAuthMiddleware, classTeacherAuthForClassMiddleware, setWorkingDays);
router.get('/get-attendance/:studentId', teacherAuthMiddleware, classTeacherAuthForClassMiddleware, getAttendance);
router.get('/attendance/:studentId', teacherAuthMiddleware, classTeacherAuthForClassMiddleware, getAttendanceReport);
router.post('/set-working-days-excel', teacherAuthMiddleware, classTeacherAuthForClassMiddleware, upload.single('file'), setWorkingDaysFromExcel);
router.post('/assign-attendance-excel', teacherAuthMiddleware, classTeacherAuthForClassMiddleware, upload.single('file'), assignAttendanceFromExcel);

router.post('/give-note', teacherAuthMiddleware, subjectTeacherAuthMiddleware, giveNote);
router.post('/acknowledge-note/:noteId', teacherAuthMiddleware, acknowledgeNote);
router.post('/give-form', teacherAuthMiddleware, classTeacherAuthMiddleware, giveForm);
router.get('/form-responses/:formId', teacherAuthMiddleware, classTeacherAuthMiddleware, getFormResponses);

// Update this route to use just teacherAuthMiddleware instead of classTeacherAuthMiddleware
// This allows any teacher to access student lists, which is needed for marksheet creation
router.get('/class-students', teacherAuthMiddleware, getClassStudents);

router.post('/chat/send', teacherAuthMiddleware, subjectTeacherAuthMiddleware, sendMessageToParent);
router.post('/chat/history', teacherAuthMiddleware, subjectTeacherAuthMiddleware, getChatHistory);
router.post('/chat/acknowledge', teacherAuthMiddleware, acknowledgeMessages);
router.get('/chat/contacts', teacherAuthMiddleware, getParentContacts);
router.get('/chat/unread-counts', teacherAuthMiddleware, getUnreadMessagesCount);
router.get('/notes', teacherAuthMiddleware, getNotes);
router.get('/forms/sent', teacherAuthMiddleware, getSentForms);
router.get('/forms/analytics/:formId', teacherAuthMiddleware, classTeacherAuthMiddleware, getFormAnalytics);
router.post('/assign-marksheet-excel', teacherAuthMiddleware, classTeacherAuthMiddleware, upload.single('file'), assignMarksheetFromExcel);
router.post('/support/complaint', teacherAuthMiddleware, submitComplaint);

export default router;