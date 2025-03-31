import { Complaint } from '../model.js';

// Handle anonymous complaint submissions
const submitAnonymousComplaint = async (req, res) => {
    try {
        const { subject, description, priority, category, name, email } = req.body;
        
        // Validate required fields
        if (!subject || !description || !name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Subject, description, name and email are required'
            });
        }
        
        // Create and save the complaint
        const complaint = new Complaint({
            subject,
            description,
            priority: priority || 'medium',
            category: category || 'other',
            status: 'pending',
            // Store anonymous user data in the description
            description: `Submitted by: ${name} (${email})\n\n${description}`
        });
        
        await complaint.save();
        
        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            complaintId: complaint._id
        });
    } catch (error) {
        console.error('Error submitting anonymous complaint:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting complaint', 
            error: error.message 
        });
    }
};

export { submitAnonymousComplaint };
