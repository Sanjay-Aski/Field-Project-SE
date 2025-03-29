import express from 'express';
import mongoose from 'mongoose';
import adminRoutes from './admin/admin_route.js';
import parerentroutes from './parents/parents_routes.js';
import teacherRoutes from './teacher/teacher_routes.js';
import userRoutes from './user.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

// Log environment variables for debugging (remove in production)
console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI exists' : 'URI missing');

// Connect to MongoDB with error handling
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Please check your .env file and ensure MONGO_URI is correctly set');
});

app.use(express.json());

// API routes
app.use('/admin', adminRoutes);
app.use('/parent', parerentroutes);
app.use('/teacher', teacherRoutes);
app.use('/user', userRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});