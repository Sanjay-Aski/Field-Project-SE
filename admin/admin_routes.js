import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import {
    // ...existing imports...
    getAllDonations,
    getPendingDonations,
    assignDonation,
    rejectDonation,
    // ...other imports...
} from './admin_controller.js';

const router = express.Router();

// ...existing routes...

// Donation routes
router.get('/donations', adminAuth, getAllDonations);
router.get('/donations/pending', adminAuth, getPendingDonations);
router.post('/donation/assign', adminAuth, assignDonation);
router.post('/donation/reject', adminAuth, rejectDonation);

// ...existing routes...

export default router;
