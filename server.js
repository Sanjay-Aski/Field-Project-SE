import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import adminRoutes from './admin/admin_route.js';
import teacherRoutes from './teacher/teacher_routes.js';
import parentRoutes from './parents/parents_routes.js';
import supportRoutes from './support/support_routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/admin', adminRoutes);
app.use('/teacher', teacherRoutes);
app.use('/parent', parentRoutes);
app.use('/support', supportRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});