import { io } from 'socket.io-client';

let socket;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

export const initiateSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found for socket connection');
    return null;
  }
  
  if (socket) {
    socket.disconnect();
  }
  
  // Connect to the server with authentication
  socket = io('http://192.168.35.107:5000', {
    auth: {
      token: token
    },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });
  
  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected');
    connectionAttempts = 0;
  });
  
  socket.on('connect_error', (error) => {
    connectionAttempts++;
    console.error(`Socket connection error (attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}):`, error);
    
    if (connectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    if (reason === 'io server disconnect') {
      // Manually reconnect if server disconnected us
      setTimeout(() => {
        socket.connect();
      }, 1000);
    }
  });
  
  return socket;
};

// Get the socket instance
export const getSocket = () => {
  if (!socket) {
    return initiateSocket();
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Send message through socket
export const sendMessage = (recipientId, studentId, message) => {
  const socket = getSocket();
  if (!socket) {
    console.error('Socket not connected');
    return false;
  }
  
  socket.emit('send_message', {
    recipientId,
    studentId,
    message
  });
  
  return true;
};

// Mark messages as read
export const markMessagesAsRead = (messageIds, senderId) => {
  const socket = getSocket();
  if (!socket || !messageIds || !senderId) {
    return false;
  }
  
  socket.emit('mark_as_read', {
    messageIds,
    senderId
  });
  
  return true;
};

// Send typing indicator
export const sendTypingStatus = (recipientId, isTyping = true) => {
  const socket = getSocket();
  if (!socket || !recipientId) {
    return false;
  }
  
  socket.emit(isTyping ? 'typing' : 'stop_typing', {
    recipientId
  });
  
  return true;
};

// Get online status of users
export const getUserStatuses = (userIds) => {
  const socket = getSocket();
  if (!socket || !userIds || !Array.isArray(userIds)) {
    return false;
  }
  
  socket.emit('get_user_status', {
    userIds
  });
  
  return true;
};

export const isSocketConnected = () => {
  return socket?.connected || false;
};
