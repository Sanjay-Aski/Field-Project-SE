import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Admin, Parent, Teacher, Student, Donation, Complaint } from '../model.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerAdmin = async (req, res) => {
    try {
        const { email, password, adminKey } = req.body;

        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) return res.status(400).json({ error: 'Admin already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ email, password: hashedPassword });

        await admin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering admin' });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

        const token = generateToken(admin._id);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

const addTeacher = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const teacher = new Teacher({ ...rest, password: hashedPassword });

        await teacher.save();
        res.status(201).json("SUCESSFULLY ADDED");
    } catch (error) {
        res.status(400).json({ error: 'Error adding teacher' });
    }
};

const removeTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

        res.json("teacher removed");
    } catch (error) {
        res.status(500).json({ error: 'Error removing teacher' });
    }
};

const addParent = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const parent = new Parent({ ...rest, password: hashedPassword });

        await parent.save();
        res.status(201).json("SUCESSFULLY ADDED");
    } catch (error) {
        res.status(400).json({ error: 'Error adding parent' });
    }
};

const removeParent = async (req, res) => {
    try {
        const parent = await Parent.findByIdAndDelete(req.params.id);
        if (!parent) return res.status(404).json({ error: 'Parent not found' });

        res.json('SUCESSFULLY_REMOVED');
    } catch (error) {
        res.status(500).json({ error: 'Error removing parent' });
    }
};

const addStudent = async (req, res) => {
    try {
        const { parentId, fullName, roll, class: studentClass, division, gender, dob } = req.body;

        // Validate input
        if (!parentId || !fullName || !roll || !studentClass || !division || !gender || !dob) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if parent exists
        const parent = await Parent.findById(parentId);
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        // Create new student
        const student = new Student({
            fullName,
            roll,
            class: studentClass,
            division,
            gender,
            dob,
            parentId
        });

        await student.save();

        // Add student to parent's children array
        parent.children.push(student._id);
        await parent.save();

        res.status(201).json({ message: 'Successfully added student' });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Error adding student' });
    }
};

const removeStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        res.json('SUCESSFULLY_REMOVED');
    } catch (error) {
        res.status(500).json({ error: 'Error removing Student' });
    }
};

const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate('donorId', 'fullName')
            .populate('interestedUsers.userId', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            donations: donations.map(donation => ({
                _id: donation._id,
                item: donation.item,
                quantity: donation.quantity,
                description: donation.description,
                donorName: donation.donorId.fullName,
                interestedUsers: donation.interestedUsers.map(user => ({
                    userId: user.userId._id,
                    userName: user.userId.fullName,
                    requestDate: user.requestDate,
                    status: user.status
                })),
                donationDate: donation.donationDate,
                status: donation.status
            }))
        });
    } catch (error) {
        console.error('Error getting all donations:', error);
        res.status(500).json({ error: 'Error getting all donations' });
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

const assignDonation = async (req, res) => {
    try {
        const { donationId, userId, quantity } = req.body;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        if (donation.status !== 'available') {
            return res.status(400).json({ error: 'This donation is not available' });
        }

        if (quantity > donation.quantity) {
            return res.status(400).json({ error: 'Requested quantity exceeds available quantity' });
        }

        // Find the interested user
        const interestedUser = donation.interestedUsers.find(
            user => user.userId.toString() === userId && user.status === 'pending'
        );

        if (!interestedUser) {
            return res.status(404).json({ error: 'User not found or request not pending' });
        }

        // Update the interested user's status and quantity
        interestedUser.status = 'approved';
        donation.quantity -= quantity;

        if (donation.quantity === 0) {
            donation.status = 'claimed';
        }

        await donation.save();

        res.status(200).json({
            message: 'Donation assigned successfully'

        });
    } catch (error) {
        console.error('Error assigning donation:', error);
        res.status(500).json({ error: 'Error assigning donation' });
    }
};

const rejectDonation = async (req, res) => {
    try {
        const { donationId, userId } = req.body;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        // Find the interested user
        const interestedUser = donation.interestedUsers.find(
            user => user.userId.toString() === userId && user.status === 'pending'
        );

        if (!interestedUser) {
            return res.status(404).json({ error: 'User not found or request not pending' });
        }

        // Update the interested user's status
        interestedUser.status = 'rejected';
        await donation.save();

        res.status(200).json({
            message: 'Donation request rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting donation request:', error);
        res.status(500).json({ error: 'Error rejecting donation request' });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, addSubjects, removeSubjects, classTeacher, ...rest } = req.body;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            rest.password = hashedPassword;
        }

        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Add subjects to the teacher
        if (addSubjects && Array.isArray(addSubjects)) {
            teacher.subjects.push(...addSubjects);
        }

        // Remove subjects from the teacher
        if (removeSubjects && Array.isArray(removeSubjects)) {
            teacher.subjects = teacher.subjects.filter(sub => 
                !removeSubjects.some(rmSub => 
                    rmSub.class === sub.class && 
                    rmSub.division === sub.division && 
                    rmSub.subject === sub.subject
                )
            );
        }

        // Update classTeacher field if provided
        if (classTeacher) {
            teacher.classTeacher = classTeacher;
        }

        // Update other fields
        Object.assign(teacher, rest);

        await teacher.save();

        res.status(200).json({ message: 'Teacher updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating teacher' });
    }
};

const updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...rest } = req.body;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            rest.password = hashedPassword;
        }

        const updatedParent = await Parent.findByIdAndUpdate(id, rest, { new: true });
        if (!updatedParent) return res.status(404).json({ error: 'Parent not found' });

        res.status(200).json({ message: 'Parent updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating parent' });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedStudent = await Student.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedStudent) return res.status(404).json({ error: 'Student not found' });

        res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating student' });
    }
};

const searchParents = async (req, res) => {
    try {
        const { fullName, email, phoneNo } = req.body;
        const query = {};

        if (fullName) {
            query.fullName = { $regex: fullName, $options: 'i' };
        }
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }
        if (phoneNo) {
            query.phoneNo = { $regex: phoneNo, $options: 'i' };
        }

        const parents = await Parent.find(query).select('-password');
        res.status(200).json(parents);
    } catch (error) {
        console.error('Error searching parents:', error);
        res.status(500).json({ error: 'Error searching parents' });
    }
};

const searchTeachers = async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const query = {};

        if (fullName) {
            query.fullName = { $regex: fullName, $options: 'i' };
        }
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }

        const teachers = await Teacher.find(query).select('-password');
        res.status(200).json(teachers);
    } catch (error) {
        console.error('Error searching teachers:', error);
        res.status(500).json({ error: 'Error searching teachers' });
    }
};

const searchStudents = async (req, res) => {
    try {
        const { fullName, roll, dob, class: studentClass, division } = req.body;
        const query = {};

        if (fullName) {
            query.fullName = { $regex: fullName, $options: 'i' };
        }
        if (roll) {
            query.roll = roll;
        }
        if (dob) {
            query.dob = new Date(dob);
        }
        if (studentClass) {
            query.class = studentClass;
        }
        if (division) {
            query.division = { $regex: division, $options: 'i' };
        }

        const students = await Student.find(query).select('-password');
        res.status(200).json(students);
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ error: 'Error searching students' });
    }
};

const getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        res.status(200).json(teacher);
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({ error: 'Error fetching teacher' });
    }
};

const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find({});
        res.status(200).json(teachers);
    } catch (error) {
        console.error('Error fetching all teachers:', error);
        res.status(500).json({ error: 'Error fetching teachers' });
    }
};

const getParentById = async (req, res) => {
    try {
        const parent = await Parent.findById(req.params.id).populate('children');
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }
        res.status(200).json(parent);
    } catch (error) {
        console.error('Error fetching parent:', error);
        res.status(500).json({ error: 'Error fetching parent' });
    }
};

const getAllParents = async (req, res) => {
    try {
        const parents = await Parent.find({}).populate('children');
        res.status(200).json(parents);
    } catch (error) {
        console.error('Error fetching all parents:', error);
        res.status(500).json({ error: 'Error fetching parents' });
    }
};

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Error fetching student' });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({});
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching all students:', error);
        res.status(500).json({ error: 'Error fetching students' });
    }
};

const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({})
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            complaints: complaints.map(complaint => ({
                _id: complaint._id,
                subject: complaint.subject,
                description: complaint.description,
                priority: complaint.priority,
                category: complaint.category,
                status: complaint.status,
                userRole: complaint.userRole,
                userName: complaint.userId ? complaint.userId.fullName : 'Unknown',
                userEmail: complaint.userId ? complaint.userId.email : 'Unknown',
                createdAt: complaint.createdAt,
                adminResponse: complaint.adminResponse
            }))
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaints',
            error: error.message
        });
    }
};

const respondToComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { responseText, status } = req.body;
        const adminId = req.admin._id;

        if (!responseText) {
            return res.status(400).json({
                success: false,
                message: 'Response text is required'
            });
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        complaint.status = status || 'resolved';
        complaint.adminResponse = {
            text: responseText,
            respondedAt: new Date(),
            adminId
        };
        complaint.updatedAt = new Date();

        await complaint.save();

        res.status(200).json({
            success: true,
            message: 'Response submitted successfully'
        });
    } catch (error) {
        console.error('Error responding to complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Error responding to complaint',
            error: error.message
        });
    }
};

const getComplaintById = async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        const complaint = await Complaint.findById(complaintId)
            .populate('userId', 'fullName email')
            .populate('adminResponse.adminId', 'email');
            
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }
        
        res.status(200).json({
            success: true,
            complaint
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaint',
            error: error.message
        });
    }
};

const updateComplaintStatus = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status } = req.body;
        const adminId = req.admin._id;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        complaint.status = status;
        complaint.updatedAt = new Date();

        await complaint.save();

        res.status(200).json({
            success: true,
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint status',
            error: error.message
        });
    }
};

export {
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
};
