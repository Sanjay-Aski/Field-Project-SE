import jwt from 'jsonwebtoken';
import { Teacher, Admin, Parent } from '../model.js';

// Admin authentication middleware
export const adminAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ error: 'No token provided. Please authenticate.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ _id: decoded.id });

        if (!admin) {
            return res.status(401).send({ error: 'Invalid token. Please authenticate.' });
        }

        req.token = token;
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Teacher authentication middleware
export const auth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ error: 'No token provided. Please authenticate.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const teacher = await Teacher.findOne({ _id: decoded.id });

        if (!teacher) {
            return res.status(401).send({ error: 'Invalid token. Please authenticate.' });
        }

        req.token = token;
        req.teacher = teacher;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Parent authentication middleware
export const parentAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ error: 'No token provided. Please authenticate.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const parent = await Parent.findOne({ _id: decoded.id });

        if (!parent) {
            return res.status(401).send({ error: 'Invalid token. Please authenticate.' });
        }

        req.token = token;
        req.parent = parent;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).send({ error: 'Please authenticate.' });
    }
};
