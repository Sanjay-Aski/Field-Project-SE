import { Parent, Student, MarkSheet, Attendance, Note, DynamicForm, Teacher, Chat, SchoolWorkingDay, Complaint } from '../model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import mongoose from 'mongoose';
const upload = multer({ storage: multer.memoryStorage() });

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).send({ error: 'Teacher not found.' });
        }

        const isMatch = await bcrypt.compare(password, teacher.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
        res.status(200).send({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send({ error: 'Error logging in.' });
    }
};

const getAttendanceReport = async (req, res) => {
    try {
        const { studentId } = req.params;
        const teacher = req.teacher;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        const attendance = await Attendance.findOne({ studentId });
        if (!attendance) {
            return res.status(404).send({ error: 'Attendance not found.' });
        }

        res.status(200).send(attendance);
    } catch (error) {
        console.error('Error getting attendance report:', error);
        res.status(500).send({ error: 'Error getting attendance report.' });
    }
};

const assignMarksheet = async (req, res) => {
    try {
        const { marksheets } = req.body;
        const teacherId = req.teacher._id;

        // Validate the teacher's authorization
        for (const sheet of marksheets) {
            const student = await Student.findById(sheet.studentId);
            if (!student) {
                return res.status(404).json({ error: `Student not found: ${sheet.studentId}` });
            }

            // Calculate total marks and percentage
            const totalObtained = sheet.subjects.reduce((sum, subj) => sum + subj.marks, 0);
            const totalPossible = sheet.subjects.reduce((sum, subj) => sum + subj.totalMarks, 0);
            const percentage = (totalObtained / totalPossible) * 100;

            // Create or update marksheet
            await MarkSheet.findOneAndUpdate(
                { 
                    studentId: sheet.studentId,
                    examType: sheet.examType
                },
                {
                    $set: {
                        subjects: sheet.subjects,
                        totalMarks: totalPossible,
                        obtainedMarks: totalObtained,
                        percentage: percentage.toFixed(2)
                    }
                },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ message: 'Marksheets updated successfully' });
    } catch (error) {
        console.error('Error assigning marksheet:', error);
        res.status(500).json({ error: 'Failed to assign marksheet' });
    }
};

const getMarksheets = async (req, res) => {
    try {
        const { studentId, examType } = req.query;
        const query = {};
        
        if (studentId) query.studentId = studentId;
        if (examType) query.examType = examType;

        const marksheets = await MarkSheet.find(query)
            .populate('studentId', 'fullName roll class division');

        res.status(200).json({ marksheets });
    } catch (error) {
        console.error('Error fetching marksheets:', error);
        res.status(500).json({ error: 'Failed to fetch marksheets' });
    }
};

const getNotes = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        const notes = await Note.find({ receiverId: teacherId }).populate('senderId', 'fullName');

        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
    }
};

// 1. Set Working Days for a Month (School side)
const setWorkingDays = async (req, res) => {
    try {
        const teacher = req.teacher;
        if (!teacher || !teacher.classTeacher) {
            return res.status(403).send({ error: "You are not authorized to set working days." });
        }
        const { month, workingDays } = req.body;
        if (!month || !workingDays || !Array.isArray(workingDays)) {
            return res.status(400).send({ error: "Month and workingDays array are required." });
        }
        // Convert workingDays strings into Date objects
        const workingDaysDates = workingDays.map(day => new Date(day));

        // Find the working days record for the teacher's assigned class and division
        let schoolDoc = await SchoolWorkingDay.findOne({
            class: teacher.classTeacher.class,
            division: teacher.classTeacher.division
        });

        if (!schoolDoc) {
            // Create a new document if not exists
            schoolDoc = new SchoolWorkingDay({
                class: teacher.classTeacher.class,
                division: teacher.classTeacher.division,
                attendance: [{
                    month,
                    workingDays: workingDaysDates
                }]
            });
        } else {
            let monthRecord = schoolDoc.attendance.find(item => item.month === month);
            if (!monthRecord) {
                schoolDoc.attendance.push({ month, workingDays: workingDaysDates });
            } else {
                monthRecord.workingDays = workingDaysDates;
            }
        }

        await schoolDoc.save();
        res.status(200).send({ message: "Working days set successfully." });
    } catch (error) {
        console.error("Error setting working days: ", error);
        res.status(500).send({ error: "Error setting working days.", details: error.message });
    }
};

const assignAttendance = async (req, res) => {
    try {
        const { studentId, month, presentDates } = req.body;
        if (!studentId || !month || !presentDates || !Array.isArray(presentDates)) {
            return res.status(400).send({ error: "studentId, month, and presentDates array are required." });
        }

        // Find the student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ error: "Student not found." });
        }

        // Find working days for the student's class and division
        const schoolDoc = await SchoolWorkingDay.findOne({
            class: student.class,
            division: student.division
        });
        if (!schoolDoc) {
            return res.status(400).send({ error: "School working days are not set for the student's class." });
        }
        const monthWorkingRecord = schoolDoc.attendance.find(item => item.month === month);
        if (!monthWorkingRecord || !monthWorkingRecord.workingDays || monthWorkingRecord.workingDays.length === 0) {
            return res.status(400).send({ error: `Working days not set for ${month}.` });
        }

        const workingDays = monthWorkingRecord.workingDays.map(day => new Date(day));

        // Convert presentDates strings into Date objects
        const newPresentDates = presentDates.map(dateStr => new Date(dateStr));

        // Find existing attendance record
        let attendanceDoc = await Attendance.findOne({ studentId });
        if (!attendanceDoc) {
            attendanceDoc = new Attendance({ studentId, attendance: [] });
        }

        // Find or create the month record
        let monthRecordInAttendance = attendanceDoc.attendance.find(item => item.month === month);
        
        if (!monthRecordInAttendance) {
            // If no attendance record exists for this month, create a new one
            const absentDates = workingDays.filter(day => 
                !newPresentDates.some(presentDate => 
                    presentDate.toDateString() === day.toDateString()
                )
            );
            const presentPercent = (newPresentDates.length / workingDays.length) * 100;
            
            attendanceDoc.attendance.push({
                month,
                presentDates: newPresentDates,
                absentDates,
                presentpercent: presentPercent
            });
        } else {
            // If attendance record exists, merge the new present dates with existing ones
            // First, collect all existing present dates
            const existingPresentDates = monthRecordInAttendance.presentDates.map(date => new Date(date));
            
            // Combine existing and new present dates, avoiding duplicates
            const allPresentDates = [...existingPresentDates];
            
            // Add new dates that don't already exist
            newPresentDates.forEach(newDate => {
                const newDateStr = newDate.toDateString();
                if (!allPresentDates.some(date => date.toDateString() === newDateStr)) {
                    allPresentDates.push(newDate);
                }
            });
            
            // Calculate absent dates (working days that are not in the combined present dates)
            const presentDateStrings = allPresentDates.map(date => date.toDateString());
            const absentDates = workingDays.filter(day => 
                !presentDateStrings.includes(day.toDateString())
            );
            
            // Calculate new percentage
            const presentPercent = (allPresentDates.length / workingDays.length) * 100;
            
            // Update the month record
            monthRecordInAttendance.presentDates = allPresentDates;
            monthRecordInAttendance.absentDates = absentDates;
            monthRecordInAttendance.presentpercent = presentPercent;
        }

        await attendanceDoc.save();
        res.status(200).send({ 
            message: "Attendance sheet assigned successfully.",
            totalPresent: monthRecordInAttendance?.presentDates.length || newPresentDates.length,
            presentDates: monthRecordInAttendance?.presentDates || newPresentDates
        });
    } catch (error) {
        console.error("Error assigning attendance sheet:", error);
        res.status(500).send({ error: "Error assigning attendance sheet.", details: error.message });
    }
};

// 3. Get Attendance Sheet for a Student for a Given Month
// Query parameters: studentId and month (e.g., /api/teacher/getAttendanceSheet?studentId=xxx&month=March%202025)
const getAttendance = async (req, res) => {
    try {
        const { studentId, month } = req.body;
        if (!studentId || !month) {
            return res.status(400).send({ error: "studentId and month are required." });
        }

        const attendanceDoc = await Attendance.findOne({ studentId });
        if (!attendanceDoc) {
            return res.status(404).send({ error: "No attendance record found for this student." });
        }

        const monthRecord = attendanceDoc.attendance.find(item => item.month === month);
        if (!monthRecord) {
            return res.status(404).send({ error: `Attendance record for ${month} not found.` });
        }

        res.status(200).send(monthRecord);
    } catch (error) {
        console.error("Error getting attendance sheet:", error);
        res.status(500).send({ error: "Error getting attendance sheet.", details: error.message });
    }
};

const getMarksheet = async (req, res) => {
    try {
        const { studentId } = req.params;
        const teacher = req.teacher;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        const marksheet = await MarkSheet.findOne({ studentId });
        if (!marksheet) {
            return res.status(404).send({ error: 'Marksheet not found.' });
        }

        res.status(200).send(marksheet);
    } catch (error) {
        console.error('Error getting marksheet:', error);
        res.status(500).send({ error: 'Error getting marksheet.' });
    }
};

const getClassMarksheets = async (req, res) => {
    try {
        const { classNum, division, examType } = req.query;
        
        if (!classNum || !division) {
            return res.status(400).json({ 
                success: false,
                message: 'Class and division are required parameters' 
            });
        }

        // First get all students in this class
        const students = await Student.find({
            class: classNum,
            division: division
        }).select('_id fullName roll');

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class'
            });
        }

        // Get all student IDs
        const studentIds = students.map(student => student._id);

        // Build the query
        const query = {
            studentId: { $in: studentIds }
        };

        if (examType) {
            query.examType = examType;
        }

        // Find marksheets for all these students
        const marksheets = await MarkSheet.find(query)
            .populate('studentId', 'fullName roll');

        // Format response to be more useful for the frontend
        const formattedResponse = students.map(student => {
            const studentMarksheets = marksheets.filter(
                ms => ms.studentId._id.toString() === student._id.toString()
            );
            
            return {
                student: {
                    _id: student._id,
                    fullName: student.fullName,
                    roll: student.roll
                },
                marksheets: studentMarksheets.map(ms => ({
                    _id: ms._id,
                    examType: ms.examType,
                    percentage: ms.percentage,
                    obtainedMarks: ms.obtainedMarks,
                    totalMarks: ms.totalMarks
                }))
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedResponse
        });
    } catch (error) {
        console.error('Error fetching class marksheets:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching class marksheets',
            error: error.message
        });
    }
};

const giveNote = async (req, res) => {
    try {
        const { studentId, note } = req.body;
        const teacher = req.teacher;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        const newNote = new Note({
            senderId: teacher._id,
            receiverId: studentId,
            title: req.body.title,
            note: note
        });

        await newNote.save();

        res.status(201).send("note given");
    } catch (error) {
        console.error('Error giving note:', error);
        res.status(500).send({ error: 'Error giving note.' });
    }
};

const acknowledgeNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const parent = req.parent;

        const note = await Note.findById(noteId);
        if (!note) {
            return res.status(404).send({ error: 'Note not found.' });
        }

        note.acknowledged = true;
        note.acknowledgedAt = new Date();
        await note.save();

        res.status(200).send(note);
    } catch (error) {
        console.error('Error acknowledging note:', error);
        res.status(500).send({ error: 'Error acknowledging note.' });
    }
};

const giveForm = async (req, res) => {
    try {
        const { title, description, fields, assignedTo, class: classInfo, studentIds } = req.body;
        const teacher = req.teacher;

        // Validate if teacher is class teacher when assigning to class
        if (assignedTo === 'class') {
            if (!teacher.classTeacher || 
                teacher.classTeacher.class !== classInfo.standard || 
                teacher.classTeacher.division !== classInfo.division) {
                return res.status(403).send({ 
                    error: 'You can only assign class forms to your own class' 
                });
            }

            // Get all students from the class
            const classStudents = await Student.find({
                class: classInfo.standard,
                division: classInfo.division
            });

            // Create form with class students
            const form = new DynamicForm({
                title,
                description,
                assignedTo,
                class: {
                    standard: classInfo.standard,
                    division: classInfo.division
                },
                studentIds: classStudents.map(student => student._id),
                fields,
                createdBy: teacher._id
            });

            await form.save();
            res.status(201).send(form);

        } else if (assignedTo === 'specific') {
            // Validate if students exist and are in teacher's class
            const students = await Student.find({
                _id: { $in: studentIds },
                class: teacher.classTeacher.class,
                division: teacher.classTeacher.division
            });

            if (students.length !== studentIds.length) {
                return res.status(400).send({ 
                    error: 'Some students not found or not in your class' 
                });
            }

            // Create form for specific students
            const form = new DynamicForm({
                title,
                description,
                assignedTo,
                studentIds,
                fields
            });

            await form.save();
            res.status(201).send("successfully form assigned");
        }

    } catch (error) {
        console.error('Error giving form:', error);
        res.status(500).send({ error: 'Error giving form.' });
    }
};

const getSentForms = async (req, res) => {
    try {
        const teacherId = req.teacher._id;

        // Get all forms created by this teacher
        const forms = await DynamicForm.find({
            createdBy: teacherId
        })
        .select('title description assignedTo class studentIds fields responses createdAt')
        .populate('studentIds', 'fullName class division')
        .lean();

        if (!forms || forms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No forms found'
            });
        }

        // Format response data
        const formattedForms = forms.map(form => ({
            _id: form._id,
            title: form.title,
            description: form.description,
            assignedTo: form.assignedTo,
            class: form.assignedTo === 'class' ? form.class : null

        }));

        return res.status(200).json({
            success: true,
            forms: formattedForms
        });

    } catch (error) {
        console.error('Error fetching sent forms:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sent forms',
            error: error.message
        });
    }
};

const getFormAnalytics = async (req, res) => {
    try {
        const { formId } = req.params;
        const teacherId = req.teacher._id;

        const form = await DynamicForm.findOne({
            _id: formId,
            createdBy: teacherId
        })
        .populate('responses.parentId', 'fullName')
        .populate('responses.studentId', 'fullName class division')
        .lean();

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Calculate statistics for each field
        const fieldStats = form.fields.map(field => {
            let stats = {
                label: field.label,
                type: field.type,
                totalResponses: form.responses.length
            };

            if (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') {
                const optionCounts = {};
                field.options.forEach(option => {
                    optionCounts[option] = 0;
                });

                form.responses.forEach(response => {
                    const answer = response.answers.find(a => a.field === field.label);
                    if (answer) {
                        optionCounts[answer.value] = (optionCounts[answer.value] || 0) + 1;
                    }
                });

                stats.optionStats = Object.entries(optionCounts).map(([option, count]) => ({
                    option,
                    count,
                    percentage: ((count / form.responses.length) * 100).toFixed(1)
                }));
            }

            if (field.type === 'text' || field.type === 'email') {
                stats.responses = form.responses.map(response => {
                    const answer = response.answers.find(a => a.field === field.label);
                    return {
                        response: answer ? answer.value : '',
                        parent: response.parentId.fullName,
                        student: response.studentId.fullName,
                        class: `${response.studentId.class}-${response.studentId.division}`
                    };
                });
            }

            return stats;
        });

        // Overall statistics
        const overallStats = {
            totalAssigned: form.assignedTo === 'class' ? 
                await Student.countDocuments({
                    class: form.class.standard,
                    division: form.class.division
                }) : 
                form.studentIds.length,
            responseCount: form.responses.length,
            responseRate: 0,
            lastResponse: form.responses.length > 0 ? 
                new Date(Math.max(...form.responses.map(r => r.createdAt))) : null
        };

        overallStats.responseRate = ((overallStats.responseCount / overallStats.totalAssigned) * 100).toFixed(1);

        return res.status(200).json({
            success: true,
            formTitle: form.title,
            formDescription: form.description,
            createdAt: form.createdAt,
            overallStats,
            fieldStats
        });

    } catch (error) {
        console.error('Error getting form analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting form analytics',
            error: error.message
        });
    }
};

const getFormResponses = async (req, res) => {
    try {
        const { formId } = req.params;
        const teacher = req.teacher;

        const form = await DynamicForm.findById(formId);
        if (!form) {
            return res.status(404).send({ error: 'Form not found.' });
        }

        res.status(200).send(form.responses);
    } catch (error) {
        console.error('Error getting form responses:', error);
        res.status(500).send({ error: 'Error getting form responses.' });
    }
};

const getClassStudents = async (req, res) => {
    try {
        const teacher = req.teacher;
        // Get class and division from query parameters if provided
        const classFilter = req.query.class || null;
        const divisionFilter = req.query.division || null;
        const studentId = req.query.studentId || null;
        
        // If studentId is provided, validate that it's a valid MongoDB ObjectID
        if (studentId) {
            // Check if ID is a valid MongoDB ObjectId before querying
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format'
                });
            }
            
            const student = await Student.findById(studentId).populate('parentId', 'fullName');
            
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            
            // Check if teacher has permission to access this student (more permissive check)
            const hasAccess = teacher.classTeacher && 
                              teacher.classTeacher.class === student.class &&
                              teacher.classTeacher.division === student.division ||
                              teacher.subjects.some(subject => 
                                subject.class === student.class && 
                                subject.division === subject.division
                              );
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this student'
                });
            }
            
            return res.status(200).json([student]);
        }
        
        // If no studentId is provided, require class and division
        if (!classFilter || !divisionFilter) {
            return res.status(400).json({
                success: false,
                message: 'Class and division must be specified in query parameters'
            });
        }

        // Verify that the teacher is authorized to view this class
        const isClassTeacher = teacher.classTeacher && 
                              teacher.classTeacher.class.toString() === classFilter.toString() && 
                              teacher.classTeacher.division === divisionFilter;
                              
        const isSubjectTeacher = teacher.subjects.some(subject => 
            subject.class.toString() === classFilter.toString() && 
            subject.division === divisionFilter
        );

        if (!isClassTeacher && !isSubjectTeacher) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You do not teach this class.' 
            });
        }

        // Fetch students from the specified class
        const students = await Student.find({
            class: classFilter,
            division: divisionFilter
        }).populate('parentId', 'fullName');

        res.status(200).json(students);
    } catch (error) {
        console.error('Error getting class students:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error getting class students.',
            error: error.message
        });
    }
};

const sendMessageToParent = async (req, res) => {
    try {
        const { parentId, studentId, message } = req.body;
        const teacherId = req.teacher._id;

        if (!parentId || !studentId || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parent ID, Student ID and message are required' 
            });
        }

        // Verify if teacher teaches the student
        const student = await Student.findById(studentId).populate('parentId');
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        if (student.parentId._id.toString() !== parentId) {
            return res.status(403).send({ error: 'Parent does not match student' });
        }

        // Create and save the chat message
        const chat = new Chat({
            senderId: teacherId,
            receiverId: parentId,
            senderModel: 'Teacher',
            receiverModel: 'Parent',
            message,
            studentId
        });

        await chat.save();

        res.status(201).json({ 
            success: true,
            message: 'Message sent successfully',
            chatMessage: {
                id: chat._id,
                text: chat.message,
                timestamp: chat.createdAt,
                senderId: 'me'
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending message.', 
            error: error.message 
        });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const { parentId, studentId } = req.body;
        const teacherId = req.teacher._id;

        // Validate input
        if (!parentId) {
            return res.status(400).send({ error: 'Parent ID is required' });
        }
        
        if (!studentId) {
            return res.status(400).send({ error: 'Student ID is required' });
        }

        // Verify if teacher teaches the student
        const student = await Student.findById(studentId).populate('parentId');
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        if (student.parentId._id.toString() !== parentId) {
            return res.status(403).send({ error: 'Parent does not match student' });
        }

        // Get chat messages
        const messages = await Chat.find({
            studentId: studentId,
            $or: [
                { senderId: teacherId, receiverId: parentId },
                { senderId: parentId, receiverId: teacherId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'fullName')
        .populate('receiverId', 'fullName');

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            text: msg.message,
            senderId: msg.senderId._id.toString() === teacherId.toString() ? 'me' : msg.senderId._id,
            timestamp: msg.createdAt,
            senderName: msg.senderId.fullName,
            read: msg.read,
            readAt: msg.readAt
        }));

        res.status(200).json({
            success: true,
            count: messages.length,
            messages: formattedMessages
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).send({ error: 'Error getting chat history.', details: error.message });
    }
};

const acknowledgeMessages = async (req, res) => {
    try {
        const { parentId, studentId } = req.body;
        const teacherId = req.teacher._id;

        if (!parentId || !studentId) {
            return res.status(400).json({
                success: false,
                message: 'Parent ID and Student ID are required'
            });
        }

        // Update all unread messages from this parent to read
        const result = await Chat.updateMany(
            {
                studentId: studentId,
                senderId: parentId,
                receiverId: teacherId,
                read: false
            },
            {
                $set: {
                    read: true,
                    readAt: new Date()
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Messages acknowledged',
            updatedCount: result.nModified || result.modifiedCount || 0
        });
    } catch (error) {
        console.error('Error acknowledging messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error acknowledging messages',
            error: error.message
        });
    }
};

const assignMarksheetFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        console.log("File received:", req.file.originalname);

        // Read Excel file
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        // If the first row is instructions, skip it.
        let startRow = 0;
        if (jsonData[0] && jsonData[0][0] && jsonData[0][0].toString().trim().toUpperCase() === "INSTRUCTIONS:") {
            startRow = 1;
        }

        const results = [];
        for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[0] || row[0].toString().trim() === "") continue; // Skip blank rows

            // Validate that the Student ID in the first column is a valid ObjectId.
            if (!mongoose.Types.ObjectId.isValid(row[0])) {
                console.warn(`Skipping row ${i + 1}: invalid ObjectId for student id: ${row[0]}`);
                continue;
            }

            const studentId = row[0];
            const examType = row[1];

            // Check if student exists
            const student = await Student.findById(studentId);
            if (!student) {
                console.log(`Student not found: ${studentId}`);
                results.push({ studentId, error: "Student not found" });
                continue;
            }

            let subjects = [];
            let obtainedMarks = 0;
            let totalMarks = 0;

            // Process subjects dynamically
            for (let j = 2; j < jsonData[0].length; j += 4) {
                if (!row[j]) break; // Stop if subject is missing

                let subject = row[j];
                let marks = parseInt(row[j + 1]) || 0;
                let maxMarks = parseInt(row[j + 2]) || 100;
                let teacherRemarks = row[j + 3] || "No remark";

                obtainedMarks += marks;
                totalMarks += maxMarks;

                subjects.push({
                    subject,
                    marks,
                    totalMarks: maxMarks,
                    teacherRemarks,
                });
            }

            // Calculate percentage
            const percentage = (obtainedMarks / totalMarks) * 100;

            // Save to database
            const marksheet = new MarkSheet({
                studentId,
                examType,
                subjects,
                totalMarks,
                obtainedMarks,
                percentage: percentage.toFixed(2),
                overallRemarks: "No overall remarks"
            });

            await marksheet.save();
            results.push({ studentId, message: "Marksheet saved successfully" });
        }

        res.status(200).json({ message: "Excel data processed", results });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "Error processing file.", details: error.message });
    }
};

const setWorkingDaysFromExcel = async (req, res) => {
    try {
        const teacher = req.teacher;
        if (!teacher || !teacher.classTeacher) {
            return res.status(403).send({ error: "You are not authorized to set working days." });
        }

        if (!req.file) {
            return res.status(400).send({ error: "No file uploaded." });
        }

        // Read Excel file
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (jsonData.length < 4) {
            return res.status(400).send({ error: "Invalid Excel format. Ensure correct structure!" });
        }

        const headers = jsonData[0]; // First row: should contain "month"
        const months = jsonData[1]; // Second row: Actual months (e.g., "March 2025")
        const workingDaysHeader = jsonData[2]; // Third row: should be "workingDays"

        const attendanceData = [];

        months.forEach((month, col) => {
            if (
                !month ||
                !workingDaysHeader[col] ||
                typeof workingDaysHeader[col] !== "string" ||
                workingDaysHeader[col].trim().toLowerCase() !== "workingdays"
            ) {
                return; // Skip if no valid month or workingDays header
            }

            const workingDays = jsonData
                .slice(3) // Start from row 4 (index 3)
                .map(row => row[col])
                .filter(dateStr => dateStr) // Remove empty values
                .map(dateStr => {
                    if (typeof dateStr === "string" && dateStr.includes("-")) {
                        // Convert DD-MM-YYYY to YYYY-MM-DD
                        const [day, month, year] = dateStr.split("-").map(Number);
                        return new Date(`${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`);
                    } else if (!isNaN(dateStr)) {
                        // Handle Excel numeric dates (Excel stores dates as numbers)
                        const excelEpoch = new Date(1899, 11, 30);
                        return new Date(excelEpoch.getTime() + (dateStr * 86400000));
                    } else {
                        console.warn(`Skipping invalid date: ${dateStr}`);
                        return null;
                    }
                })
                .filter(date => date instanceof Date && !isNaN(date)); // Remove invalid dates

            if (workingDays.length > 0) {
                attendanceData.push({ month, workingDays });
            }
        });

        if (attendanceData.length === 0) {
            return res.status(400).send({ error: "No valid working days found in the file. Check date format!" });
        }

        // Find or create the working days record
        let schoolDoc = await SchoolWorkingDay.findOne({
            class: teacher.classTeacher.class,
            division: teacher.classTeacher.division
        });

        if (!schoolDoc) {
            schoolDoc = new SchoolWorkingDay({
                class: teacher.classTeacher.class,
                division: teacher.classTeacher.division,
                attendance: attendanceData
            });
        } else {
            // Update existing document
            attendanceData.forEach(({ month, workingDays }) => {
                let monthRecord = schoolDoc.attendance.find(item => item.month === month);
                if (!monthRecord) {
                    schoolDoc.attendance.push({ month, workingDays });
                } else {
                    monthRecord.workingDays = workingDays;
                }
            });
        }

        await schoolDoc.save();
        res.status(200).send({ message: "Working days set successfully." });
    } catch (error) {
        console.error("Error setting working days: ", error);
        res.status(500).send({ error: "Error setting working days.", details: error.message });
    }
};

const assignAttendanceFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ error: "No file uploaded." });
        }

        const teacher = req.teacher;
        const excelBuffer = req.file.buffer;

        // Parse the Excel file
        const workbook = xlsx.read(excelBuffer);
        
        // Extract metadata if available
        let classNum, division, month;
        
        // Check if _metadata sheet exists and extract class, division and month
        if (workbook.SheetNames.includes('_metadata')) {
            const metadataSheet = workbook.Sheets['_metadata'];
            const metadataJson = xlsx.utils.sheet_to_json(metadataSheet);
            
            const classMetadata = metadataJson.find(item => item.metadata_key === 'class');
            const divisionMetadata = metadataJson.find(item => item.metadata_key === 'division');
            const monthMetadata = metadataJson.find(item => item.metadata_key === 'month');
            
            if (classMetadata) classNum = classMetadata.metadata_value.toString();
            if (divisionMetadata) division = divisionMetadata.metadata_value;
            if (monthMetadata && monthMetadata.metadata_value) month = monthMetadata.metadata_value;
        }
        
        // If metadata not found in Excel, try to get from teacher's profile
        if (!classNum || !division) {
            if (teacher.classTeacher && teacher.classTeacher.class) {
                classNum = teacher.classTeacher.class.toString();
                division = teacher.classTeacher.division;
            } else {
                // Extract class and division from file name as a fallback
                const filename = req.file.originalname;
                const classMatch = filename.match(/class-(\d+)-([A-Z])/i);
                if (classMatch) {
                    classNum = classMatch[1];
                    division = classMatch[2].toUpperCase();
                } else {
                    return res.status(400).send({ 
                        error: "Could not determine class and division. Please ensure file name includes class-{CLASS}-{DIVISION} or upload from the appropriate class page." 
                    });
                }
            }
        }

        // Return error if still can't determine class and division
        if (!classNum || !division) {
            return res.status(400).send({ 
                error: "Class and division information not found in the file and couldn't be determined from context." 
            });
        }

        // Make sure the teacher has access to this class
        const hasAccess = teacher.classTeacher && 
            teacher.classTeacher.class.toString() === classNum && 
            teacher.classTeacher.division === division;
        
        if (!hasAccess) {
            // Check if they teach any subjects in this class
            const teachesSubject = teacher.subjects && teacher.subjects.some(
                subject => subject.class.toString() === classNum && subject.division === division
            );
            
            if (!teachesSubject) {
                return res.status(403).send({ error: "You don't have permission to update attendance for this class." });
            }
        }
        
        // Get the first worksheet (ignoring metadata sheet)
        const mainSheetName = workbook.SheetNames.filter(name => name !== '_metadata')[0];
        const worksheet = workbook.Sheets[mainSheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

        // Get students from the class and create a map for faster lookup
        const students = await Student.find({ 
            class: classNum, 
            division: division 
        });

        if (!students || students.length === 0) {
            return res.status(400).send({ error: `No students found in class ${classNum}-${division}.` });
        }
        
        const studentMap = {};
        students.forEach(student => {
            studentMap[student._id.toString()] = student;
        });

        // Find the month if not already determined
        if (!month) {
            // Try to extract month from worksheet name
            const sheetNameMatch = mainSheetName.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i);
            if (sheetNameMatch) {
                month = sheetNameMatch[0];
            } else {
                // Look for month in instructions
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (Array.isArray(row) && row.length > 0) {
                        const rowText = row.join(' ');
                        const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i;
                        const match = rowText.match(monthRegex);
                        if (match) {
                            month = match[0];
                            break;
                        }
                    }
                }
                
                // If still no month, use current month
                if (!month) {
                    const currentDate = new Date();
                    month = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
                }
            }
        }

        // Check if we have enough rows
        if (jsonData.length < 2) {
            return res.status(400).send({ error: "Excel file does not contain enough data." });
        }

        const headers = jsonData[0]; // First row should be headers
        const results = [];

        // Get school working days for this class and month
        let schoolDoc = await SchoolWorkingDay.findOne({
            class: classNum,
            division: division
        });
        
        if (!schoolDoc || !schoolDoc.attendance || !schoolDoc.attendance.some(item => item.month === month)) {
            return res.status(400).send({ error: `Working days not set for ${month} for class ${classNum}-${division}.` });
        }

        const monthWorkingRecord = schoolDoc.attendance.find(item => item.month === month);
        const workingDays = monthWorkingRecord.workingDays;
        
        // Convert workingDays to a set of normalized date strings for easier comparison
        const workingDaySet = new Set(workingDays.map(day => {
            const d = new Date(day);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }));
                
        // Find student ID column and date columns
        const studentIdColumnIndex = headers.findIndex(h => h === 'Student ID');
        if (studentIdColumnIndex === -1) {
            return res.status(400).send({ error: "Could not find 'Student ID' column in Excel." });
        }
        
        // Map column indices to dates
        const dateColumnMap = new Map();
        const summaryColumnIndices = new Set(); // To track summary columns
        
        headers.forEach((header, index) => {
            // Skip the first 3 columns (Student ID, Name, Roll) and summary columns at the end
            if (index > 2 && header !== 'Total Present' && header !== 'Total Absent' && header !== 'Percentage') {
                // Check if the header is a number (day of month)
                if (!isNaN(parseInt(header))) {
                    const day = parseInt(header);
                    const [monthName, yearStr] = month.split(' ');
                    const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth();
                    const year = parseInt(yearStr);
                    
                    // Create the date object and a normalized string version
                    const date = new Date(year, monthIndex, day);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    
                    // Only include this column if it's a working day
                    if (workingDaySet.has(dateStr)) {
                        dateColumnMap.set(index, dateStr);
                    }
                }
            } else if (header === 'Total Present' || header === 'Total Absent' || header === 'Percentage') {
                summaryColumnIndices.add(index);
            }
        });

        // Process attendance data by student
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length <= studentIdColumnIndex) continue;

            const studentId = row[studentIdColumnIndex];
            if (!studentId || !studentMap[studentId]) continue;

            const presentDates = [];

            // Check each date column for present marks
            dateColumnMap.forEach((dateStr, columnIndex) => {
                const cellValue = row[columnIndex];
                
                // If the cell contains 'p' or any value that indicates presence
                if (cellValue && String(cellValue).toLowerCase().includes('p')) {
                    // Convert the date string to a Date object
                    const year = parseInt(dateStr.split('-')[0]);
                    const month = parseInt(dateStr.split('-')[1]) - 1; // JavaScript months are 0-indexed
                    const day = parseInt(dateStr.split('-')[2]);
                    
                    const date = new Date(year, month, day);
                    presentDates.push(date);
                }
            });

            // Calculate absent days based on working days minus present days
            // Convert present dates to a set of strings for comparison
            const presentDateStrings = new Set(presentDates.map(date => {
                const d = date;
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }));
            
            // Absent days are working days that are not in present dates
            const absentDates = [];
            workingDaySet.forEach(dateStr => {
                if (!presentDateStrings.has(dateStr)) {
                    const year = parseInt(dateStr.split('-')[0]);
                    const month = parseInt(dateStr.split('-')[1]) - 1;
                    const day = parseInt(dateStr.split('-')[2]);
                    absentDates.push(new Date(year, month, day));
                }
            });
            
            // Calculate percentage
            const presentPercent = workingDays.length > 0 ? (presentDates.length / workingDays.length) * 100 : 0;

            // Update or create attendance record
            let attendanceDoc = await Attendance.findOne({ studentId });

            if (!attendanceDoc) {
                attendanceDoc = new Attendance({ studentId, attendance: [] });
            }

            let monthRecord = attendanceDoc.attendance.find(item => item.month === month);

            if (!monthRecord) {
                // If the month does not exist, push a new record
                await Attendance.updateOne(
                    { studentId },
                    {
                        $push: {
                            attendance: {
                                month,
                                presentDates,
                                absentDates,
                                presentpercent: presentPercent
                            }
                        }
                    },
                    { upsert: true }
                );
            } else {
                // If the month exists, use $set safely
                await Attendance.updateOne(
                    { studentId, "attendance.month": month },
                    {
                        $set: {
                            "attendance.$.presentDates": presentDates,
                            "attendance.$.absentDates": absentDates,
                            "attendance.$.presentpercent": presentPercent
                        }
                    }
                );
            }

            results.push({
                studentId,
                studentName: studentMap[studentId].fullName,
                month,
                totalWorkingDays: workingDays.length,
                presentDays: presentDates.length,
                absentDays: absentDates.length,
                presentPercent: presentPercent.toFixed(2)
            });
        }

        res.status(200).json({
            message: "Attendance processed successfully",
            totalRecords: results.length,
            results,
            classDetails: {
                class: classNum,
                division: division
            }
        });

    } catch (error) {
        console.error("Error processing attendance file:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing attendance file', 
            error: error.message 
        });
    }
};

const getTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        
        // Find teacher and populate relevant data
        const teacher = await Teacher.findById(teacherId)
            .select('-password')
            .lean();
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found.'
            });
        }
        
        // Add additional data if needed
        // For example, fetch class info, student counts, etc.
        
        res.status(200).json({
            success: true,
            teacher
        });
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching teacher profile', 
            error: error.message 
        });
    }
};

const submitComplaint = async (req, res) => {
    try {
        const { subject, description, priority, category } = req.body;
        const teacherId = req.teacher._id;
        
        // Validate required fields
        if (!subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Subject and description are required'
            });
        }
        
        // Create and save the complaint
        const complaint = new Complaint({
            userId: teacherId,
            userRole: 'Teacher',
            subject,
            description,
            priority: priority || 'medium',
            category: category || 'other',
            status: 'pending'
        });
        
        await complaint.save();
        
        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            complaintId: complaint._id
        });
    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting complaint', 
            error: error.message 
        });
    }
};

const getParentContacts = async (req, res) => {
    try {
        const teacher = req.teacher;
        
        // Prepare class conditions based on teacher's assignments
        const classConditions = [];
        
        // Add teacher's class if they're a class teacher
        if (teacher.classTeacher && teacher.classTeacher.class && teacher.classTeacher.division) {
            classConditions.push({
                class: teacher.classTeacher.class,
                division: teacher.classTeacher.division
            });
        }
        
        // Add classes where teacher teaches subjects
        teacher.subjects.forEach(subject => {
            if (subject.class && subject.division) {
                const exists = classConditions.some(
                    cond => cond.class === subject.class && cond.division === subject.division
                );
                
                if (!exists) {
                    classConditions.push({
                        class: subject.class,
                        division: subject.division
                    });
                }
            }
        });
        
        if (classConditions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No classes assigned to this teacher'
            });
        }
        
        // Get all students from classes taught by the teacher
        const students = await Student.find({
            $or: classConditions
        }).populate('parentId', 'fullName email');
        
        // Format the response
        const contacts = students.map(student => ({
            id: student.parentId._id,
            studentId: student._id,
            name: student.parentId.fullName,
            role: `Parent of ${student.fullName}`,
            class: `${student.class}-${student.division}`,
            avatar: null,
            unread: 0, // Will be populated by the unread-counts endpoint
            lastMessage: null,
            lastActive: 'Unknown'
        }));
        
        res.status(200).json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error fetching parent contacts:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching contacts', 
            error: error.message 
        });
    }
};

const getUnreadMessagesCount = async (req, res) => {
    try {
        const teacherId = req.teacher._id;
        
        // Get total count of unread messages
        const totalUnread = await Chat.countDocuments({
            receiverId: teacherId,
            receiverModel: 'Teacher',
            read: false
        });
        
        // Get unread counts per parent
        const unreadData = await Chat.aggregate([
            {
                $match: {
                    receiverId: teacherId,
                    receiverModel: 'Teacher',
                    read: false
                }
            },
            {
                $group: {
                    _id: {
                        parentId: "$senderId",
                        studentId: "$studentId"
                    },
                    unreadCount: { $sum: 1 },
                    lastMessage: { $last: "$message" },
                    timestamp: { $last: "$createdAt" }
                }
            },
            {
                $project: {
                    _id: 0,
                    parentId: "$_id.parentId",
                    studentId: "$_id.studentId",
                    unreadCount: 1,
                    lastMessage: 1,
                    timestamp: 1
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            totalUnread,
            unreadData
        });
    } catch (error) {
        console.error('Error getting unread message count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread message count',
            error: error.message
        });
    }
};

const getMarksheetTemplate = async (req, res) => {
    try {
        // Get class, division and exam type from query parameters
        const { class: classNum, division, examType } = req.query;
        
        // Validate input
        if (!classNum || !division) {
            return res.status(400).json({ 
                success: false, 
                message: 'Class and division are required parameters' 
            });
        }
        
        // Check if exam type is valid
        const validExamTypes = ['Unit-I', 'Semester-I', 'Unit-II', 'Semester-II'];
        const selectedExamType = validExamTypes.includes(examType) ? examType : '';
        
        // Fetch students from the specified class
        const students = await Student.find({
            class: classNum,
            division: division
        }).sort({ roll: 1 }).select('_id fullName roll');
        
        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class'
            });
        }
        
        // Create a new workbook
        const workbook = xlsx.utils.book_new();
        
        // Create the headers
        const headers = ['Student ID', 'Student Name', 'Roll No', 'Exam Type'];
        
        // Get subjects taught by the teacher in this class
        const teacherSubjects = req.teacher.subjects
            .filter(subject => 
                subject.class.toString() === classNum.toString() && 
                subject.division === division
            )
            .map(subject => subject.subject);
        
        // If no subjects found for this teacher in this class, use default subjects
        const subjectsToUse = teacherSubjects.length > 0 ? 
            teacherSubjects : 
            ['Mathematics', 'Science', 'English', 'Social Studies'];
        
        // Add subject columns (each with marks, total marks, and remarks columns)
        subjectsToUse.forEach(subject => {
            headers.push(`${subject} Marks`);
            headers.push(`${subject} Max Marks`);
            headers.push(`${subject} Remarks`);
        });
        
        // Create data rows with student information pre-filled
        const data = [headers];
        
        // Add rows for actual students with pre-filled information
        students.forEach(student => {
            const studentRow = [
                student._id.toString(),                // Actual student ID
                student.fullName,                      // Actual student name
                student.roll.toString(),               // Actual roll number
                selectedExamType                       // Pre-selected exam type (if provided)
            ];
            
            // Add empty cells for marks, with default max marks value
            subjectsToUse.forEach(subject => {
                studentRow.push(''); // Empty marks cell
                // Use appropriate default max marks based on exam type
                const defaultMaxMarks = selectedExamType && 
                    (selectedExamType === 'Unit-I' || selectedExamType === 'Unit-II') ? 
                    '20' : '100';
                studentRow.push(defaultMaxMarks); // Default max marks based on exam type
                studentRow.push(''); // Empty remarks cell
            });
            
            data.push(studentRow);
        });
        
        // Create the worksheet with the data
        const worksheet = xlsx.utils.aoa_to_sheet(data);
        
        // Set column widths for better readability
        const colWidths = [
            { wch: 24 }, // Student ID
            { wch: 20 }, // Student Name
            { wch: 8 },  // Roll No
            { wch: 15 }, // Exam Type
        ];
        
        subjectsToUse.forEach(() => {
            colWidths.push({ wch: 10 }); // Marks
            colWidths.push({ wch: 10 }); // Max Marks  
            colWidths.push({ wch: 20 }); // Remarks
        });
        
        worksheet['!cols'] = colWidths;
        
        // Add instructions below the data
        const lastRowIndex = data.length + 2;
        
        const instructions = [
            ['INSTRUCTIONS:'],
            ['1. Do not modify the Student ID, Student Name, Roll No and Exam Type columns'],
            ['2. Enter marks and optional remarks for each subject'],
            ['3. Max Marks are pre-filled but can be adjusted if needed'],
        ];
        
        if (!selectedExamType) {
            // Add instruction about exam type if not pre-selected
            instructions.push(['4. Add one of these exam types: Unit-I, Semester-I, Unit-II, or Semester-II']);
        }
        
        xlsx.utils.sheet_add_aoa(worksheet, instructions, { origin: `A${lastRowIndex}` });
        
        // Generate filename based on class, division and exam type
        const filenameExamPart = selectedExamType ? `-${selectedExamType}` : '';
        const filename = `marksheet-class-${classNum}-${division}${filenameExamPart}.xlsx`;
        
        // Add the worksheet to the workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, `Class ${classNum}-${division} Marksheet`);
        
        // Generate buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set the appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        // Send the file
        res.send(buffer);
    } catch (error) {
        console.error('Error generating marksheet template:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating template', 
            error: error.message 
        });
    }
};

const getAttendanceTemplate = async (req, res) => {
    try {
        const { class: classNum, division, format, month } = req.query;
        
        // Validate input
        if (!classNum || !division) {
            return res.status(400).json({ 
                success: false, 
                message: 'Class, division, and month are required parameters' 
            });
        }
        
        // Validate format
        const templateFormat = format && ['weekly', 'monthly'].includes(format) ? format : 'monthly';
        
        // Fetch students from the specified class
        const students = await Student.find({
            class: classNum,
            division: division
        }).sort({ roll: 1 }).select('_id fullName roll');
        
        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class'
            });
        }
        
        // Create a new workbook
        const workbook = xlsx.utils.book_new();
        
        // Add metadata sheet to store class and division information
        const metadataData = [
            { metadata_key: 'class', metadata_value: classNum },
            { metadata_key: 'division', metadata_value: division },
            { metadata_key: 'template_type', metadata_value: templateFormat },
            { metadata_key: 'month', metadata_value: month || '' },
            { metadata_key: 'generated_date', metadata_value: new Date().toISOString() }
        ];
        
        const metadataSheet = xlsx.utils.json_to_sheet(metadataData);
        xlsx.utils.book_append_sheet(workbook, metadataSheet, '_metadata');
        
        // Get working days for the specified month if provided
        let workingDays = [];
        if (month) {
            const schoolDoc = await SchoolWorkingDay.findOne({
                class: parseInt(classNum),
                division: division
            });
            
            if (schoolDoc) {
                const monthRecord = schoolDoc.attendance.find(item => item.month === month);
                if (monthRecord && monthRecord.workingDays) {
                    workingDays = monthRecord.workingDays;
                }
            }
        }
        
        if (templateFormat === 'weekly') {
            // Weekly format - one sheet with all students for a week
            const headers = ['Student ID', 'Student Name', 'Roll No', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Total Present', 'Total Absent', 'Percentage'];
            
            const data = [headers];
            
            // Add rows for students with empty cells for attendance marking
            students.forEach(student => {
                const studentRow = [
                    student._id.toString(),
                    student.fullName,
                    student.roll.toString(),
                    '', '', '', '', '', '', '',  // Empty cells for weekdays
                    '', '', ''  // Empty cells for totals
                ];
                data.push(studentRow);
            });
            
            // Create the worksheet with the data
            const worksheet = xlsx.utils.aoa_to_sheet(data);
            
            // Add column formatting
            const colWidths = [
                { wch: 24 }, // Student ID
                { wch: 20 }, // Student Name
                { wch: 8 },  // Roll No
                { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, // Days
                { wch: 12 }, // Total Present
                { wch: 12 }, // Total Absent
                { wch: 10 }  // Percentage
            ];
            
            worksheet['!cols'] = colWidths;
            
            // Add instructions
            const lastRowIndex = data.length + 2;
            
            const instructions = [
                ['INSTRUCTIONS:'],
                ['1. "p" indicates present days, empty cells indicate absent days'],
                ['2. Do not modify the Student ID, Student Name and Roll No columns'],
                ['3. This is a weekly template, with days of the week as columns'],
                [`4. Class: ${classNum}, Division: ${division}`],
                ['5. Use one template per week, adding the week start date when saving']
            ];
            
            // Add instructions
            xlsx.utils.sheet_add_aoa(worksheet, instructions, { origin: `A${lastRowIndex}` });
            
            // Add the worksheet to the workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, `Weekly Attendance`);
            
        } else {
            // Monthly format - one sheet with student IDs in rows and dates in columns
            // Calculate dates for the current month or the specified month
            const today = new Date();
            let year, monthIndex, monthName;
            
            if (month) {
                const [monthPart, yearPart] = month.split(' ');
                monthName = monthPart;
                year = parseInt(yearPart);
                monthIndex = new Date(`${monthPart} 1, ${yearPart}`).getMonth();
            } else {
                // Use current month if not specified
                year = today.getFullYear();
                monthIndex = today.getMonth();
                monthName = today.toLocaleString('default', { month: 'long' });
            }
            
            // Get days in month
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            
            // Create headers with dates
            const headers = ['Student ID', 'Student Name', 'Roll No'];
            
            // Filter the days in month to only include working days
            const workingDaysMap = new Map();
            
            // If we have working days defined, use only those
            if (workingDays.length > 0) {
                workingDays.forEach(day => {
                    const dayDate = new Date(day);
                    const dayOfMonth = dayDate.getDate();
                    workingDaysMap.set(dayOfMonth, true);
                    headers.push(dayOfMonth.toString());
                });
            } else {
                // If no working days defined, include all days for the template
                for (let i = 1; i <= daysInMonth; i++) {
                    const date = new Date(year, monthIndex, i);
                    // Default to weekdays (Monday to Friday)
                    if (date.getDay() !== 0 && date.getDay() !== 6) {
                        workingDaysMap.set(i, true);
                        headers.push(i.toString());
                    }
                }
            }
            
            // Add summary columns
            headers.push('Total Present', 'Total Absent', 'Percentage');
            
            const data = [headers];
            
            // Add rows for students with empty cells for attendance marking
            students.forEach(student => {
                const studentRow = [
                    student._id.toString(),
                    student.fullName,
                    student.roll.toString()
                ];
                
                // Add empty cells for each working day
                if (workingDays.length > 0) {
                    workingDays.forEach(() => {
                        studentRow.push('');
                    });
                } else {
                    for (let i = 1; i <= daysInMonth; i++) {
                        const date = new Date(year, monthIndex, i);
                        if (date.getDay() !== 0 && date.getDay() !== 6) {
                            studentRow.push('');
                        }
                    }
                }
                
                // Add empty cells for totals
                studentRow.push('', '', '');
                
                data.push(studentRow);
            });
            
            // Create the worksheet with the data
            const worksheet = xlsx.utils.aoa_to_sheet(data);
            
            // Add column formatting - make date columns narrower
            const colWidths = [
                { wch: 24 }, // Student ID
                { wch: 20 }, // Student Name
                { wch: 8 },  // Roll No
            ];
            
            // Add narrow width for working day columns
            const workingDaysCount = workingDaysMap.size;
            for (let i = 0; i < workingDaysCount; i++) {
                colWidths.push({ wch: 6 });
            }
            
            // Add width for total columns
            colWidths.push({ wch: 12 }); // Total Present
            colWidths.push({ wch: 12 }); // Total Absent
            colWidths.push({ wch: 10 }); // Percentage
            
            worksheet['!cols'] = colWidths;
            
            // Add instructions below the data
            const lastRowIndex = data.length + 2;
            
            const instructions = [
                ['INSTRUCTIONS:'],
                ['1. "p" indicates present days, empty cells indicate absent days'],
                ['2. Do not modify the Student ID, Student Name and Roll No columns'],
                [`3. This is a monthly template for ${monthName} ${year}`],
                [`4. Class: ${classNum}, Division: ${division}`],
                ['5. Only working days are included in the template'],
                ['6. The last three columns show attendance statistics']
            ];
            
            // Add instructions
            xlsx.utils.sheet_add_aoa(worksheet, instructions, { origin: `A${lastRowIndex}` });
            
            // Add the worksheet to the workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, `Monthly Attendance`);
        }
        
        // Generate filename
        const filenameFormat = templateFormat === 'weekly' ? 'weekly' : 'monthly';
        const monthStr = month ? `-${month.replace(' ', '-')}` : '';
        const filename = `attendance-${filenameFormat}-class-${classNum}-${division}${monthStr}.xlsx`;
        
        // Generate buffer
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        // Set the appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        // Send the file
        res.send(buffer);
        
    } catch (error) {
        console.error('Error generating attendance template:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating template', 
            error: error.message 
        });
    }
};

const getMonthlyAttendance = async (req, res) => {
    try {
        const { classNum, division, month } = req.query;
        
        if (!classNum || !division || !month) {
            return res.status(400).json({ 
                success: false,
                message: 'Class, division, and month are required parameters' 
            });
        }
        
        // Find students in this class
        const students = await Student.find({
            class: classNum,
            division: division
        }).sort({ roll: 1 }).select('_id fullName roll');
        
        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class'
            });
        }
        
        // Get working days for this class and month
        const schoolDoc = await SchoolWorkingDay.findOne({
            class: parseInt(classNum),
            division: division
        });
        
        let workingDays = [];
        if (schoolDoc) {
            const monthRecord = schoolDoc.attendance.find(item => item.month === month);
            if (monthRecord) {
                workingDays = monthRecord.workingDays;
            }
        }
        
        // Check if working days are defined
        if (workingDays.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No working days defined for this month. Please set working days first.',
                workingDaysCount: 0,
                attendanceStats: []
            });
        }
        
        // Get attendance records for all students
        const studentIds = students.map(student => student._id);
        const attendanceRecords = await Attendance.find({
            studentId: { $in: studentIds }
        });
        
        // Format the response with attendance statistics
        const attendanceStats = students.map(student => {
            const studentAttendanceDoc = attendanceRecords.find(
                record => record.studentId.toString() === student._id.toString()
            );
            
            let presentDays = 0;
            let absentDays = 0;
            
            if (studentAttendanceDoc) {
                const monthRecord = studentAttendanceDoc.attendance.find(item => item.month === month);
                if (monthRecord) {
                    // Create a normalized format for date comparison - using just YYYY-MM-DD strings
                    // This ensures we don't have timezone or time-of-day issues
                    const presentDatesArray = monthRecord.presentDates.map(date => {
                        const d = new Date(date);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    });
                    
                    // Similarly convert working days to the same normalized format
                    const workingDaysArray = workingDays.map(day => {
                        const d = new Date(day);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    });
                    
                    // Create sets for faster lookups
                    const presentDatesSet = new Set(presentDatesArray);
                    const workingDaysSet = new Set(workingDaysArray);
                    
                    // Count present days (days that are both in present dates and working days)
                    presentDays = [...workingDaysSet].filter(day => presentDatesSet.has(day)).length;
                    
                    // Absent days are simply working days minus present days
                    absentDays = workingDaysSet.size - presentDays;
                } else {
                    // If student has no attendance record for this month, mark all working days as absent
                    absentDays = workingDays.length;
                }
            } else {
                // If student has no attendance record at all, mark all working days as absent
                absentDays = workingDays.length;
            }
            
            return {
                _id: student._id,
                fullName: student.fullName,
                roll: student.roll,
                attendance: {
                    present: presentDays,
                    absent: absentDays
                }
            };
        });
        
        res.status(200).json({
            success: true,
            workingDaysCount: workingDays.length,
            attendanceStats
        });
    } catch (error) {
        console.error('Error fetching monthly attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly attendance stats',
            error: error.message
        });
    }
};

const getWorkingDays = async (req, res) => {
    try {
        const { month } = req.query;
        const teacherId = req.teacher._id;
        
        if (!month) {
            return res.status(400).json({
                success: false,
                message: 'Month parameter is required'
            });
        }

        // Get the class and division from query parameters if provided
        const classNum = req.query.class;
        const division = req.query.division;

        // If class and division are provided in query, use those
        // Otherwise, use the teacher's assigned class
        let classToUse, divisionToUse;
        
        if (classNum && division) {
            classToUse = parseInt(classNum);
            divisionToUse = division;
        } else if (req.teacher.classTeacher) {
            classToUse = req.teacher.classTeacher.class;
            divisionToUse = req.teacher.classTeacher.division;
        } else {
            // If no class specified and teacher is not a class teacher, return error
            return res.status(400).json({
                success: false,
                message: 'Class and division must be specified'
            });
        }
        
        // Find the working days record for the specified class and division
        const schoolDoc = await SchoolWorkingDay.findOne({
            class: classToUse,
            division: divisionToUse
        });
        
        if (!schoolDoc) {
            // If no working days document exists yet, return empty array
            return res.status(200).json({
                success: true,
                workingDays: [],
                isDefault: false
            });
        }
        
        // Find the working days for the specified month
        const monthRecord = schoolDoc.attendance.find(item => item.month === month);
        
        if (!monthRecord) {
            // Return empty array if no working days set for this month
            return res.status(200).json({
                success: true,
                workingDays: [],
                isDefault: false
            });
        }
        
        // Format the dates as strings (YYYY-MM-DD)
        const formattedWorkingDays = monthRecord.workingDays.map(date => {
            const d = new Date(date);
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        });
        
        res.status(200).json({
            success: true,
            workingDays: formattedWorkingDays,
            isDefault: false
        });
        
    } catch (error) {
        console.error('Error fetching working days:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching working days',
            error: error.message
        });
    }
};

export { 
    login, 
    assignMarksheet, 
    setWorkingDays,
    getWorkingDays,
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
    getMarksheetTemplate,
    getMonthlyAttendance,
    getAttendanceTemplate
};

