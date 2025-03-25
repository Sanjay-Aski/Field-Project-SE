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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

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