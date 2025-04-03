import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPaperPlane, FaUserCircle, FaArrowLeft, FaSearch, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getSocket, sendMessage, markMessagesAsRead, sendTypingStatus } from '../../../services/socketService';

const ParentChatPage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-chat-notification-bell-tone-2304.mp3');
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const totalUnread = teachers.reduce((sum, teacher) => sum + (teacher.unread || 0), 0);
    setUnreadMessageCount(totalUnread);
    setNewMessageAlert(totalUnread > 0);
  }, [teachers]);

  useEffect(() => {
    socketRef.current = getSocket();

    if (!socketRef.current) {
      console.error('Socket connection failed');
      return;
    }

    socketRef.current.on('receive_message', (newMessage) => {
      if (
        selectedTeacher &&
        newMessage.senderId === selectedTeacher._id &&
        newMessage.studentId === studentId
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: newMessage._id,
            message: newMessage.message,
            senderName: newMessage.senderName,
            senderModel: newMessage.senderModel,
            timestamp: newMessage.timestamp,
            isSender: false,
            read: false,
          },
        ]);

        markMessagesAsRead([newMessage._id], newMessage.senderId);
      } else {
        setTeachers((prev) =>
          prev.map((teacher) => {
            if (teacher._id === newMessage.senderId) {
              setNewMessageAlert(true);
              setUnreadMessageCount((prevCount) => prevCount + 1);

              if (audioRef.current) {
                audioRef.current.play().catch((e) => console.error('Error playing sound:', e));
              }

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`New message from ${teacher.fullName || 'Teacher'}`, {
                  body: newMessage.message,
                  icon: '/favicon.ico',
                });
              }

              return {
                ...teacher,
                unread: (teacher.unread || 0) + 1,
                lastMessage: newMessage.message,
                lastActiveTime: new Date().toISOString(),
              };
            }
            return teacher;
          })
        );
      }
    });

    socketRef.current.on('message_sent', (sentMsg) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === `temp-${sentMsg._id}` || msg._id === 'sending'
            ? {
                _id: sentMsg._id,
                message: sentMsg.message,
                senderName: 'You',
                senderModel: 'Parent',
                timestamp: sentMsg.timestamp,
                isSender: true,
                read: false,
              }
            : msg
        )
      );

      setSendingMessage(false);
    });

    socketRef.current.on('messages_read', (data) => {
      const { messageIds, readBy, readAt } = data;

      if (!messageIds || !Array.isArray(messageIds)) return;

      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id)
            ? { ...msg, read: true, readAt }
            : msg
        )
      );
    });

    socketRef.current.on('user_typing', (data) => {
      const { userId, userName } = data;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: {
          name: userName,
          timestamp: Date.now(),
        },
      }));
    });

    socketRef.current.on('user_stop_typing', (data) => {
      const { userId } = data;

      setTypingUsers((prev) => {
        const newTypingUsers = { ...prev };
        delete newTypingUsers[userId];
        return newTypingUsers;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.off('message_sent');
        socketRef.current.off('messages_read');
        socketRef.current.off('user_typing');
        socketRef.current.off('user_stop_typing');
      }
    };
  }, [selectedTeacher, studentId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (studentId) {
          // IMPORTANT FIX: First thing we do is fetch unread message count
          // to ensure notification persists even on page reload
          try {
            console.log("Fetching unread counts for student:", studentId); // Debugging
            const unreadResponse = await fetch('http://192.168.35.107:5000/parent/chat/unread-count-all', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ studentId })
            });
            
            if (unreadResponse.ok) {
              const unreadData = await unreadResponse.json();
              console.log("Unread data received:", unreadData); // Debugging
              
              if (unreadData.success) {
                const totalUnread = unreadData.totalUnread || 0;
                setUnreadMessageCount(totalUnread);
                // IMPORTANT: Set notification state based on server data, not UI state
                if (totalUnread > 0) {
                  setNewMessageAlert(true);
                  
                  if (audioRef.current) {
                    audioRef.current.play().catch(e => console.error('Error playing sound:', e));
                  }
                }
              }
            } else {
              console.error("Failed to fetch unread message counts");
            }
          } catch (err) {
            console.error("Error checking unread messages:", err);
          }

          // Now continue with normal data fetching
          const studentResponse = await fetch(`http://192.168.35.107:5000/parent/children`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!studentResponse.ok) {
            throw new Error(`Failed to fetch student data: ${studentResponse.status}`);
          }
          
          const studentsData = await studentResponse.json();
          const currentStudent = studentsData.find(s => s._id === studentId);
          
          if (!currentStudent) {
            throw new Error('Student not found');
          }
          
          setStudent(currentStudent);
          
          const teachersResponse = await fetch(`http://192.168.35.107:5000/parent/teacher-details/${studentId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!teachersResponse.ok) {
            throw new Error(`Failed to fetch teachers: ${teachersResponse.status}`);
          }
          
          const teachersData = await teachersResponse.json();
          setTeachers(teachersData);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError(error.message);
        toast.error('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [studentId]);

  useEffect(() => {
    if (selectedTeacher && studentId) {
      fetchChatHistory(selectedTeacher._id);
    }
  }, [selectedTeacher, studentId]);

  const fetchChatHistory = async (teacherId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://192.168.35.107:5000/parent/chat/history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: teacherId,
          studentId: studentId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        
        const unreadMessages = data.messages.filter(msg => 
          !msg.read && !msg.isSender
        );
        
        if (unreadMessages.length > 0) {
          acknowledgeMessages(teacherId);
        }

        setTeachers((prev) => {
          const updatedTeachers = prev.map((teacher) => {
            if (teacher._id === teacherId) {
              setUnreadMessageCount((prevCount) => Math.max(0, prevCount - (teacher.unread || 0)));
              return { ...teacher, unread: 0 };
            }
            return teacher;
          });

          const totalUnread = updatedTeachers.reduce((sum, teacher) => sum + (teacher.unread || 0), 0);
          if (totalUnread === 0) {
            setNewMessageAlert(false);
          }

          return updatedTeachers;
        });
      } else {
        throw new Error(data.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const acknowledgeMessages = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch('http://192.168.35.107:5000/parent/chat/acknowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: teacherId,
          studentId: studentId
        })
      });
      
      setTeachers(prev => 
        prev.map(teacher => 
          teacher._id === teacherId 
            ? { ...teacher, unread: 0 } 
            : teacher
        )
      );
    } catch (error) {
      console.error('Error acknowledging messages:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [loadingMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedTeacher || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      message: newMessage,
      senderName: 'You',
      senderModel: 'Parent',
      timestamp: new Date(),
      isSender: true,
      read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setSendingMessage(true);

    try {
      const sent = sendMessage(selectedTeacher._id, studentId, newMessage);

      if (!sent) {
        throw new Error('Failed to send message through WebSocket');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);

      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setSendingMessage(false);
    }
  };

  const handleMessageTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (selectedTeacher && value.trim().length > 0) {
      sendTypingStatus(selectedTeacher._id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(selectedTeacher._id, false);
      }, 3000);
    }
  };

  const renderTypingIndicator = () => {
    if (selectedTeacher && typingUsers[selectedTeacher._id]) {
      return (
        <div className="text-xs text-gray-500 italic px-4 pb-1">
          {selectedTeacher.fullName} is typing...
        </div>
      );
    }
    return null;
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subjects?.some(subject => 
      subject.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto p-4">
      {/* Use a more permanent notification that won't disappear on reload */}
      {newMessageAlert && (
        <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white py-2 px-4 rounded-lg shadow-lg flex items-center">
          <FaEnvelope className="mr-2" />
          <span>You have {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <Link to="/parent/dashboard" className="mr-3 text-gray-600 hover:text-gray-800">
            <FaArrowLeft />
          </Link>
          {student ? `Chat - ${student.fullName}` : 'Chat with Teachers'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex h-[70vh]">
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-700">Teachers</h2>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <FaSearch className="absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="overflow-y-auto">
              {filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No teachers found</div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedTeacher && selectedTeacher._id === teacher._id
                        ? 'bg-primary-50'
                        : teacher.unread > 0
                        ? 'bg-yellow-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <FaUserCircle className="text-primary-600 text-xl" />
                        {teacher.unread > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {teacher.unread}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-800">{teacher.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {teacher.subjects?.join(', ') || 'No subjects'}{' '}
                          {teacher.isClassTeacher && (
                            <span className="text-primary-600">(Class Teacher)</span>
                          )}
                        </p>
                        {teacher.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {teacher.lastMessage.length > 25
                              ? teacher.lastMessage.substring(0, 25) + '...'
                              : teacher.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-2/3 flex flex-col">
            {selectedTeacher ? (
              <>
                <div className="p-4 bg-white border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FaUserCircle className="text-primary-600 text-xl" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">{selectedTeacher.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {selectedTeacher.isClassTeacher
                          ? 'Class Teacher'
                          : selectedTeacher.subjects?.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p className="mb-2">No messages yet</p>
                      <p className="text-sm">Start the conversation by sending a message below</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isParentSender = msg.senderModel === 'Parent' || msg.isSender === true;

                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isParentSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                                isParentSender
                                  ? 'bg-primary-100 text-secondary-800 rounded-br-none'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                              }`}
                            >
                              {!isParentSender && (
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  {msg.senderName || selectedTeacher?.fullName || 'Teacher'}
                                </p>
                              )}
                              <p className="break-words">{msg.message}</p>
                              <div className="flex items-center justify-end mt-1 text-xs text-gray-500">
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                {isParentSender && (
                                  <span className="ml-1">
                                    {msg.read ? (
                                      <span className="text-blue-500 ml-1">✓✓</span>
                                    ) : (
                                      <span className="text-gray-400 ml-1">✓</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t">
                  <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleMessageTyping}
                      placeholder="Type your message..."
                      disabled={sendingMessage}
                      className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className={`py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        newMessage.trim() && !sendingMessage
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {sendingMessage ? (
                        <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      ) : (
                        <FaPaperPlane />
                      )}
                    </button>
                  </form>
                  {renderTypingIndicator()}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="mb-2">Select a teacher to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentChatPage;
