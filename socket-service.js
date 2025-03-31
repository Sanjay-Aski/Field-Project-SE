import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Teacher, Parent, Chat } from './model.js';

// Store active connections with their user info
const activeUsers = new Map();

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict to your domain
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Check if teacher
      const teacher = await Teacher.findById(decoded.id);
      if (teacher) {
        socket.user = {
          id: teacher._id.toString(),
          role: 'teacher',
          fullName: teacher.fullName
        };
        return next();
      }
      
      // Check if parent
      const parent = await Parent.findById(decoded.id);
      if (parent) {
        socket.user = {
          id: parent._id.toString(),
          role: 'parent',
          fullName: parent.fullName
        };
        return next();
      }
      
      next(new Error('User not found'));
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.role} - ${socket.user.id}`);
    
    // Add user to active users map
    activeUsers.set(socket.user.id, {
      socketId: socket.id,
      role: socket.user.role,
      fullName: socket.user.fullName
    });
    
    // Join room based on user ID for direct messages
    socket.join(socket.user.id);
    
    // Handle chat message
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, studentId, message } = data;
        
        if (!recipientId || !studentId || !message) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }
        
        const senderId = socket.user.id;
        const senderRole = socket.user.role;
        const receiverRole = senderRole === 'teacher' ? 'Parent' : 'Teacher';
        
        // Save message to database
        const chat = new Chat({
          senderId: senderId,
          receiverId: recipientId,
          senderModel: senderRole === 'teacher' ? 'Teacher' : 'Parent',
          receiverModel: receiverRole,
          message: message,
          studentId: studentId,
          read: false
        });
        
        await chat.save();
        
        // Format message for real-time delivery
        const messageData = {
          _id: chat._id,
          message: chat.message,
          senderId: senderId,
          senderName: socket.user.fullName,
          senderModel: chat.senderModel,
          recipientId: recipientId,
          studentId: studentId,
          timestamp: chat.createdAt,
          read: false
        };
        
        // Send to recipient if online
        if (activeUsers.has(recipientId)) {
          io.to(recipientId).emit('receive_message', messageData);
        }
        
        // Also send back to sender for confirmation
        socket.emit('message_sent', {
          ...messageData,
          status: 'sent'
        });
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle read receipts
    socket.on('mark_as_read', async (data) => {
      try {
        const { messageIds, senderId } = data;
        
        if (!messageIds || !Array.isArray(messageIds) || !senderId) {
          return;
        }
        
        await Chat.updateMany(
          { 
            _id: { $in: messageIds },
            senderId: senderId,
            receiverId: socket.user.id,
            read: false
          },
          {
            $set: {
              read: true,
              readAt: new Date()
            }
          }
        );
        
        // Notify the original sender that messages were read
        if (activeUsers.has(senderId)) {
          io.to(senderId).emit('messages_read', {
            messageIds,
            readBy: socket.user.id,
            readAt: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      const { recipientId } = data;
      if (recipientId && activeUsers.has(recipientId)) {
        io.to(recipientId).emit('user_typing', {
          userId: socket.user.id,
          userName: socket.user.fullName
        });
      }
    });
    
    // Handle stop typing
    socket.on('stop_typing', (data) => {
      const { recipientId } = data;
      if (recipientId && activeUsers.has(recipientId)) {
        io.to(recipientId).emit('user_stop_typing', {
          userId: socket.user.id
        });
      }
    });
    
    // Handle user status (online/offline)
    socket.on('get_user_status', (data) => {
      const { userIds } = data;
      if (!userIds || !Array.isArray(userIds)) return;
      
      const statuses = {};
      userIds.forEach(id => {
        statuses[id] = activeUsers.has(id) ? 'online' : 'offline';
      });
      
      socket.emit('user_statuses', statuses);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.role} - ${socket.user.id}`);
      activeUsers.delete(socket.user.id);
      
      // Broadcast to all connected users that this user is offline
      socket.broadcast.emit('user_offline', { userId: socket.user.id });
    });
  });

  return io;
};

export default initializeSocketServer;
