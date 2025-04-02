import { Parent, Student, MarkSheet, Attendance, Note, DynamicForm, Teacher, Chat, Donation, Complaint } from '../model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const parent = await Parent.findOne({ email });
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        const isMatch = await bcrypt.compare(password, parent.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: parent._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

const getChildren = async (req, res) => {
    try {
        const parent = req.parent;
        const children = await Student.find({ _id: { $in: parent.children } });

        res.status(200).send(children);
    } catch (error) {
        console.error('Error getting children:', error);
        res.status(500).send({ error: 'Error getting children.' });
    }
};

const getForms = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parentId = req.parent._id;

        // Handle special case for "not-filled" which isn't a valid ObjectId
        if (studentId === 'not-filled') {
            return getAllFormsNotFilled(req, res);
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const parent = await Parent.findById(parentId);
        if (!parent.children.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this student\'s forms'
            });
        }

        const forms = await DynamicForm.find({
            $or: [
                {
                    assignedTo: 'specific',
                    studentIds: studentId
                },
                {
                    assignedTo: 'class',
                    'class.standard': student.class,
                    'class.division': student.division
                }
            ]
        })
        .select('title description fields createdAt responses')
        .lean();

        if (!forms || forms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No forms found for this student'
            });
        }

        const formattedForms = forms.map(form => ({
            _id: form._id,
            title: form.title,
            description: form.description,
            fields: form.fields,
            createdAt: form.createdAt,
            isResponded: form.responses?.some(response => 
                response.parentId?.toString() === parentId.toString() && 
                response.studentId?.toString() === studentId
            ) || false
        }));

        return res.status(200).json({
            success: true,
            forms: formattedForms
        });

    } catch (error) {
        console.error('Error fetching forms:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching forms',
            error: error.message
        });
    }
};

const getMarksheet = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parent = req.parent;

        const student = await Student.findById(studentId);
        if (!student || !parent.children.includes(studentId)) {
            return res.status(404).send({ error: 'Student not found or not your child.' });
        }

        const marksheet = await MarkSheet.findOne({ studentId: studentId });

        res.status(200).send(marksheet);
    } catch (error) {
        console.error('Error getting marksheet:', error);
        res.status(500).send({ error: 'Error getting marksheet.' });
    }
};

const getMarksheetByExamType = async (req, res) => {
    try {
        const { studentId, examType } = req.params;
        const parent = req.parent;

        // Verify this is parent's child
        if (!parent.children.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this student\'s marksheets'
            });
        }

        // Check if the student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const marksheet = await MarkSheet.findOne({ 
            studentId,
            examType
        });

        // If no marksheet is found, return an empty array instead of a 404 error
        // This allows the client to show a "no marksheet available" message
        if (!marksheet) {
            return res.status(200).json([]);
        }

        res.status(200).json([marksheet]); // Return as array for consistency with frontend code
    } catch (error) {
        console.error('Error fetching marksheet by exam type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marksheet',
            error: error.message
        });
    }
};

const getMarksheetExamTypes = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parent = req.parent;

        // Verify this is parent's child
        if (!parent.children.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this student\'s marksheets'
            });
        }

        const marksheets = await MarkSheet.find({ studentId }).distinct('examType');
        
        if (!marksheets || marksheets.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(marksheets);
    } catch (error) {
        console.error('Error fetching marksheet exam types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marksheet exam types',
            error: error.message
        });
    }
};

const getAttendanceReport = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parent = req.parent;

        const student = await Student.findById(studentId);
        if (!student || !parent.children.includes(studentId)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Student not found or not your child.' 
            });
        }

        const attendance = await Attendance.findOne({ studentId });
        
        // Return an empty attendance object if no attendance record exists
        if (!attendance) {
            return res.status(200).json({
                success: true,
                message: 'No attendance records found',
                attendance: { 
                    studentId,
                    attendance: [] 
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Attendance data retrieved successfully',
            ...attendance.toObject()
        });
    } catch (error) {
        console.error('Error getting attendance report:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error getting attendance report.',
            message: error.message
        });
    }
};

const sendNoteToTeacher = async (req, res) => {
    try {
        const { teacherId, note } = req.body;
        const parent = req.parent;

        const newNote = new Note({
            senderId: parent._id,
            receiverId: teacherId,
            title: req.body.title,
            note: note
        });

        await newNote.save();

        res.status(201).send(newNote);
    } catch (error) {
        console.error('Error sending note to teacher:', error);
        res.status(500).send({ error: 'Error sending note to teacher.' });
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

        const student = await Student.findById(note.receiverId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        if (!parent.children.includes(student._id)) {
            return res.status(403).send({ error: 'You can only acknowledge notes for your children.' });
        }

        const teacher = await Teacher.findById(note.senderId);
        if (!teacher) {
            return res.status(404).send({ error: 'Teacher not found.' });
        }

        note.acknowledged = true;
        note.acknowledgedAt = new Date();
        await note.save();

        res.status(200).send({
            message: 'Note acknowledged successfully' });
    } catch (error) {
        console.error('Error acknowledging note:', error);
        res.status(500).send({ error: 'Error acknowledging note.' });
    }
};

const getTeacherDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parent = req.parent;

        const student = await Student.findById(studentId);
        if (!student || !parent.children.includes(studentId)) {
            return res.status(404).send({ error: 'Student not found or not your child.' });
        }

        const teachers = await Teacher.find({
            $or: [
                { 'classTeacher.class': student.class, 'classTeacher.division': student.division },
                { 'subjects.class': student.class, 'subjects.division': student.division }
            ]
        });

        const teacherDetails = teachers.map(teacher => ({
            _id: teacher._id, // Include the teacher ID
            fullName: teacher.fullName,
            subjects: teacher.subjects.filter(subject => subject.class === student.class && subject.division === student.division).map(subject => subject.subject),
            isClassTeacher: teacher.classTeacher && teacher.classTeacher.class === student.class && teacher.classTeacher.division === student.division
        }));

        res.status(200).send(teacherDetails);
    } catch (error) {
        console.error('Error getting teacher details:', error);
        res.status(500).send({ error: 'Error getting teacher details.' });
    }
};

const fillForm = async (req, res) => {
    try {
        const { formId, studentId, answers } = req.body;
        const parent = req.parent;

        const form = await DynamicForm.findById(formId);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        if (!parent.children.includes(studentId)) {
            return res.status(403).json({ error: 'Access denied. This student is not your child.' });
        }

        if (!form.studentIds.includes(studentId)) {
            return res.status(403).json({ error: 'This form is not assigned to your child.' });
        }

        const isValidAnswers = form.fields.every(field => {
            const answer = answers.find(a => a.field === field.label);
            if (!answer) return false;

            if (field.type === 'select' || field.type === 'radio') {
                return field.options.includes(answer.value);
            }
            return true;
        });

        if (!isValidAnswers) {
            return res.status(400).json({ error: 'Invalid answers provided.' });
        }

        form.responses.push({
            parentId: parent._id,
            studentId: studentId,
            answers: answers
        });

        await form.save();

        res.status(201).json({
            message: 'Form filled successfully'
        });

    } catch (error) {
        console.error('Error filling form:', error);
        res.status(500).json({ error: 'Error filling form', details: error.message });
    }
};

const sendMessageToTeacher = async (req, res) => {
    try {
        const { teacherId, studentId, message } = req.body;
        const parent = req.parent;

        if (!parent.children.includes(studentId)) {
            return res.status(403).send({ error: 'You can only send messages about your children' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).send({ error: 'Teacher not found.' });
        }

        // Fix the authorization check to properly verify the teacher's relationship to the student
        const teachesClass = teacher.subjects.some(subject => 
            subject.class === student.class && 
            subject.division === student.division
        ) || (teacher.classTeacher && 
               teacher.classTeacher.class === student.class && 
               teacher.classTeacher.division === student.division);

        if (!teachesClass) {
            return res.status(403).send({ error: 'You can only chat with teachers who teach your child' });
        }

        const chat = new Chat({
            senderId: parent._id,
            receiverId: teacherId,
            senderModel: 'Parent',
            receiverModel: 'Teacher',
            message,
            studentId
        });

        await chat.save();

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send({ error: 'Error sending message.' });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const { teacherId, studentId } = req.body;
        const parent = req.parent;

        if (!teacherId || !studentId) {
            return res.status(400).send({ error: 'Teacher ID and Student ID are required' });
        }

        if (!parent.children.includes(studentId)) {
            return res.status(403).send({ error: 'You can only view chats about your children' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ error: 'Student not found.' });
        }

        const messages = await Chat.find({
            studentId: studentId,
            $or: [
                { senderId: parent._id, receiverId: teacherId },
                { senderId: teacherId, receiverId: parent._id }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'fullName')
        .populate('receiverId', 'fullName');

        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            message: msg.message,
            senderName: msg.senderId.fullName,
            receiverName: msg.receiverId.fullName,
            senderModel: msg.senderModel,
            timestamp: msg.createdAt,
            isSender: msg.senderId.toString() === parent._id.toString(),
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
        const { teacherId, studentId } = req.body;
        const parentId = req.parent._id;

        if (!teacherId || !studentId) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID and Student ID are required'
            });
        }

        if (!parentId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Update all unread messages from this teacher to read
        const result = await Chat.updateMany(
            {
                studentId: studentId,
                senderId: teacherId,
                receiverId: parentId,
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

const getUnreadMessageCount = async (req, res) => {
    try {
        const { teacherId, studentId } = req.body;
        const parentId = req.parent._id;

        if (!teacherId || !studentId) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID and Student ID are required'
            });
        }

        // Count unread messages
        const unreadCount = await Chat.countDocuments({
            studentId: studentId,
            senderId: teacherId,
            receiverId: parentId,
            read: false
        });

        // Get the latest message for preview
        const latestMessage = await Chat.findOne({
            studentId: studentId,
            $or: [
                { senderId: parentId, receiverId: teacherId },
                { senderId: teacherId, receiverId: parentId }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(1);

        res.status(200).json({
            success: true,
            count: unreadCount,
            lastMessage: latestMessage ? latestMessage.message : null,
            timestamp: latestMessage ? latestMessage.createdAt : null
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

const getUnreadMessageCountAll = async (req, res) => {
    try {
        const { studentId } = req.body;
        const parentId = req.parent._id;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Count all unread messages for this parent for the specified student
        const totalUnread = await Chat.countDocuments({
            studentId: studentId,
            receiverId: parentId,
            receiverModel: 'Parent',
            read: false
        });
        
        // Get unread counts per teacher
        const unreadByTeacher = await Chat.aggregate([
            {
                $match: {
                    studentId: studentId,
                    receiverId: parentId,
                    receiverModel: 'Parent',
                    read: false
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    unreadCount: { $sum: 1 },
                    lastMessage: { $last: "$message" },
                    timestamp: { $last: "$createdAt" }
                }
            },
            {
                $project: {
                    _id: 0,
                    teacherId: "$_id",
                    unreadCount: 1,
                    lastMessage: 1,
                    timestamp: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            totalUnread,
            unreadByTeacher
        });
    } catch (error) {
        console.error('Error getting total unread message count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting total unread message count',
            error: error.message
        });
    }
};

const getAllFormsNotFilled = async (req, res) => {
    try {
        const parentId = req.parent._id;
        const parent = await Parent.findById(parentId).populate('children');

        if (!parent) {
            return res.status(404).json({ 
                success: false, 
                message: 'Parent not found' 
            });
        }

        const forms = await DynamicForm.find({
            $or: [
                {
                    assignedTo: 'class',
                    'class.standard': { 
                        $in: parent.children.map(child => child.class) 
                    },
                    'class.division': { 
                        $in: parent.children.map(child => child.division) 
                    }
                },
                {
                    assignedTo: 'specific',
                    studentIds: { 
                        $in: parent.children.map(child => child._id) 
                    }
                }
            ],
            'responses.parentId': { 
                $ne: parentId 
            }
        }).populate('studentIds', 'fullName class division');

        res.status(200).json({ 
            success: true, 
            forms: forms.map(form => ({
                _id: form._id,
                title: form.title,
                description: form.description,
                assignedTo: form.assignedTo,
                class: form.class,
                fields: form.fields,
                createdAt: form.createdAt,
                students: form.studentIds
            }))
        });
    } catch (error) {
        console.error('Error fetching forms not filled:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching forms not filled', 
            error: error.message 
        });
    }
};

const getNotes = async (req, res) => {
    try {
        const parent = req.parent;
        const notes = await Note.find({ receiverId: { $in: parent.children } }).populate('senderId', 'fullName');

        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
    }
};

const createDonation = async (req, res) => {
    try {
        const donorId = req.parent._id;
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid donation format" });
        }

        const donations = items.map(({ item, quantity, description }) => ({
            donorId,
            item,
            quantity,
            description,
            interestedUsers: [],
            status: "available",
        }));

        await Donation.insertMany(donations);
        res.json({ message: "Donations added successfully" });
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ error: 'Error creating donation' });
    }
};

const getPendingDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ status: 'available' })
            .populate('donorId', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            donations: donations.map(donation => ({
                _id: donation._id,
                item: donation.item,
                quantity: donation.quantity,
                description: donation.description,
                donorName: donation.donorId.fullName,
                donationDate: donation.donationDate,
                status: donation.status
            }))
        });
    } catch (error) {
        console.error('Error getting pending donations:', error);
        res.status(500).json({ error: 'Error getting pending donations' });
    }
};

const applyForDonation = async (req, res) => {
    try {
        const { donationId } = req.params;
        const parent = req.parent;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        if (donation.status !== 'available') {
            return res.status(400).json({ error: 'This donation is not available' });
        }

        const alreadyRequested = donation.interestedUsers.some(
            user => user.userId.toString() === parent._id.toString()
        );

        if (alreadyRequested) {
            return res.status(400).json({ error: 'You have already requested this donation' });
        }

        donation.interestedUsers.push({
            userId: parent._id,
            requestDate: new Date(),
            status: 'pending'
        });

        await donation.save();

        res.status(200).json({
            message: 'Request submitted successfully',
        });
    } catch (error) {
        console.error('Error applying for donation:', error);
        res.status(500).json({ error: 'Error applying for donation' });
    }
};

const checkDonationRequest = async (req, res) => {
    try {
        const { donationId } = req.params;
        const parent = req.parent;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        const alreadyRequested = donation.interestedUsers.some(
            user => user.userId.toString() === parent._id.toString()
        );

        res.status(200).json({
            success: true,
            alreadyRequested
        });
    } catch (error) {
        console.error('Error checking donation request status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error checking donation request status' 
        });
    }
};

const getMyDonationRequests = async (req, res) => {
    try {
        const parentId = req.parent._id;
        
        // Find donations with this parent in interestedUsers
        const donations = await Donation.find({
            'interestedUsers.userId': parentId
        }).populate('donorId', 'fullName');
        
        if (!donations || donations.length === 0) {
            return res.status(200).json({
                success: true,
                requests: []
            });
        }
        
        // Format the response data
        const requests = donations.map(donation => {
            const request = donation.interestedUsers.find(
                user => user.userId.toString() === parentId.toString()
            );
            
            return {
                _id: donation._id,
                item: donation.item,
                category: donation.item,  // Using item as category (Books, Uniforms, etc)
                description: donation.description,
                donorName: donation.donorId.fullName,
                isAdminDonation: donation.donorId.role === 'admin',
                status: request.status,
                requestDate: request.requestDate
            };
        });
        
        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Error fetching donation requests:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching donation requests' 
        });
    }
};

const getParentProfile = async (req, res) => {
    try {
        const parentId = req.parent._id;
        
        const parent = await Parent.findById(parentId)
            .select('-password')
            .populate('children')
            .lean();
        
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent profile not found'
            });
        }
        
        res.status(200).json({
            success: true,
            parent
        });
    } catch (error) {
        console.error('Error fetching parent profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching parent profile', 
            error: error.message 
        });
    }
};

const submitComplaint = async (req, res) => {
    try {
        const { subject, description, priority, category } = req.body;
        const parentId = req.parent._id;
        
        // Validate required fields
        if (!subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Subject and description are required'
            });
        }
        
        // Create and save the complaint
        const complaint = new Complaint({
            userId: parentId,
            userRole: 'Parent',
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

const getStudentMarksheets = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parentId = req.parent._id;

        // Verify this is parent's child
        const parent = await Parent.findById(parentId);
        if (!parent?.children.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this student\'s marksheets'
            });
        }

        const marksheets = await MarkSheet.find({ studentId })
            .sort({ examType: 1, createdAt: -1 });

        if (!marksheets || marksheets.length === 0) {
            return res.status(200).json({
                success: true,
                marksheets: [],
                message: 'No marksheets found for this student'
            });
        }

        res.status(200).json({
            success: true,
            marksheets,
            message: 'Marksheets fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching marksheets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marksheets',
            error: error.message
        });
    }
};

const getClassSubjects = async (req, res) => {
    try {
        const { class: classNum, division } = req.body;
        
        if (!classNum || !division) {
            return res.status(400).json({
                success: false,
                message: 'Class and division are required'
            });
        }

        // Find all teachers who teach this class and get their subjects
        const teachers = await Teacher.find({
            $or: [
                { 'subjects.class': parseInt(classNum), 'subjects.division': division },
                { 'classTeacher.class': parseInt(classNum), 'classTeacher.division': division }
            ]
        });
        
        // Extract unique subjects
        const subjects = new Set();
        
        teachers.forEach(teacher => {
            teacher.subjects.forEach(subject => {
                if (subject.class.toString() === classNum.toString() && 
                    subject.division === division) {
                    subjects.add(subject.subject);
                }
            });
        });
        
        res.status(200).json({
            success: true,
            subjects: Array.from(subjects)
        });
    } catch (error) {
        console.error('Error fetching class subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching class subjects',
            error: error.message
        });
    }
};

export { 
    login,
    getChildren,
    fillForm, 
    getForms, 
    getMarksheet,
    getMarksheetByExamType,
    getMarksheetExamTypes, 
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
    checkDonationRequest,
    getMyDonationRequests,
    getAllFormsNotFilled,
    getNotes,
    getParentProfile,
    submitComplaint,
    getUnreadMessageCount,
    getUnreadMessageCountAll,
    getStudentMarksheets,
    getClassSubjects
};