import express from 'express';
import { submitAnonymousComplaint } from './support_controller.js';

const router = express.Router();

router.post('/complaint', submitAnonymousComplaint);

export default router;
