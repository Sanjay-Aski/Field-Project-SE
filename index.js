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
import http from 'http';
import initializeSocketServer from './socket-service.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(server);

app.use(cors());

console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI exists' : 'URI missing');

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
app.get('/', (req, res) => {
    res.send('Hello, Nikhil Landing Page kab bana rha hai?');
  });
  
// Listen on the HTTP server (not the Express app)
server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });