import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaPaperPlane, FaUsers, FaUserCircle, FaArrowLeft, FaEnvelope, FaCircle, FaCheckDouble, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getSocket, sendMessage, markMessagesAsRead, sendTypingStatus } from '../../../services/socketService';

const TeacherChatPage = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const audioRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);
  const contactsLoaded = useRef(false);
  const typingTimeoutRef = useRef(null);

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
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // IMPORTANT: Always fetch unread counts first to maintain notification state
        try {
          const unreadCountResponse = await fetch('http://192.168.35.107:5000/teacher/chat/unread-counts', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (unreadCountResponse.ok) {
            const unreadData = await unreadCountResponse.json();
            if (unreadData.success) {
              console.log("Unread data on load:", unreadData);
              const totalUnread = unreadData.totalUnread || 0;
              setUnreadMessageCount(totalUnread);
              
              if (totalUnread > 0) {
                setNewMessageAlert(true);
                // Play notification sound if there are unread messages and this is first load
                if (audioRef.current && !contactsLoaded.current) {
                  audioRef.current.play().catch(error => {
                    console.error("Error playing notification sound:", error);
                  });
                }
              }
              
              // Store unread data to use for sorting contacts later
              sessionStorage.setItem('teacherUnreadData', JSON.stringify(unreadData.unreadData || []));
            }
          }
        } catch (err) {
          console.error("Error fetching unread message counts:", err);
        }

        // Now fetch contacts as normal
        const response = await fetch('http://192.168.35.107:5000/teacher/chat/contacts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.contacts)) {
          // Get previously stored unread data
          const storedUnreadData = JSON.parse(sessionStorage.getItem('teacherUnreadData') || '[]');
          
          // Merge unread data with contacts to ensure accurate unread counts
          const contactsWithUnread = data.contacts.map(contact => {
            const unreadInfo = storedUnreadData.find(
              u => u.parentId === contact.id && u.studentId === contact.studentId
            );
            
            if (unreadInfo) {
              return {
                ...contact,
                unread: unreadInfo.unreadCount || 0,
                lastMessage: unreadInfo.lastMessage || contact.lastMessage,
                lastActiveTime: unreadInfo.timestamp || contact.lastActiveTime
              };
            }
            return contact;
          });
          
          // Enhanced sorting: unread first, then by most recent
          const sortedContacts = [...contactsWithUnread].sort((a, b) => {
            if ((a.unread || 0) !== (b.unread || 0)) {
              return (b.unread || 0) - (a.unread || 0);
            }
            
            if (a.lastActiveTime && b.lastActiveTime) {
              return new Date(b.lastActiveTime) - new Date(a.lastActiveTime);
            }
            
            return 0;
          });

          console.log("Contacts sorted by unread priority:", 
            sortedContacts.map(c => ({name: c.name, unread: c.unread || 0})));
          
          setContacts(sortedContacts);
          contactsLoaded.current = true;
          
          // Restore selected contact from session storage if exists
          const savedContactData = sessionStorage.getItem('selectedTeacherContact');
          if (savedContactData && !selectedContact) {
            try {
              const savedContact = JSON.parse(savedContactData);
              const foundContact = sortedContacts.find(
                c => c.id === savedContact.id && c.studentId === savedContact.studentId
              );
              if (foundContact) {
                setSelectedContact(foundContact);
              }
            } catch (e) {
              console.error("Error restoring selected contact:", e);
            }
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to load contacts: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
    
    // Add event listener to refresh data when window gains focus
    const handleFocus = () => {
      fetchContacts();
    };
    
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(fetchContacts, 30000);
    setRefreshInterval(interval);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Save selected contact to session storage when it changes
  useEffect(() => {
    if (selectedContact) {
      sessionStorage.setItem('selectedTeacherContact', JSON.stringify({
        id: selectedContact.id,
        studentId: selectedContact.studentId
      }));
    }
  }, [selectedContact]);

  useEffect(() => {
    if (contactsLoaded.current && contacts.length > 0 && socketRef.current) {
      const userIds = contacts.map(contact => contact.id);
      socketRef.current.emit('get_user_status', { userIds });
    }
  }, [contacts, socketRef.current]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id, selectedContact.studentId);

      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === selectedContact.id && contact.studentId === selectedContact.studentId
            ? { ...contact, selected: true }
            : { ...contact, selected: false }
        )
      );
    }
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact && messages.length > 0 && !loadingMessages) {
      acknowledgeMessages(selectedContact.id, selectedContact.studentId);
    }
  }, [messages, selectedContact, loadingMessages]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    socketRef.current = getSocket();

    if (!socketRef.current) {
      console.error('Socket connection failed');
      return;
    }

    socketRef.current.on('receive_message', (newMessage) => {
      if (selectedContact &&
        newMessage.senderId === selectedContact.id &&
        newMessage.studentId === selectedContact.studentId) {
        setMessages(prev => [...prev, {
          id: newMessage._id,
          text: newMessage.message,
          senderId: newMessage.senderId,
          timestamp: newMessage.timestamp,
          read: false
        }]);
        markMessagesAsRead([newMessage._id], newMessage.senderId);
      } else {
        setContacts(prev => {
          return prev.map(contact => {
            if (contact.id === newMessage.senderId && contact.studentId === newMessage.studentId) {
              setNewMessageAlert(true);
              setUnreadMessageCount(prevCount => prevCount + 1);

              if (audioRef.current) {
                audioRef.current.play().catch(e => console.error("Error playing sound:", e));
              }

              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("New message from " + (contact.name || "Parent"), {
                  body: newMessage.message,
                  icon: "/favicon.ico"
                });
              }

              return {
                ...contact,
                unread: (contact.unread || 0) + 1,
                lastMessage: newMessage.message,
                lastActive: 'Just now',
                lastActiveTime: new Date().toISOString()
              };
            }
            return contact;
          });
        });
      }
    });

    socketRef.current.on('message_sent', (sentMsg) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === `temp-${sentMsg._id}` || msg.id === 'sending'
            ? {
              id: sentMsg._id,
              text: sentMsg.message,
              senderId: 'me',
              timestamp: sentMsg.timestamp,
              read: false
            }
            : msg
        )
      );

      setSendingMessage(false);
    });

    socketRef.current.on('messages_read', (data) => {
      const { messageIds, readBy, readAt } = data;

      if (!messageIds || !Array.isArray(messageIds)) return;

      setMessages(prev =>
        prev.map(msg =>
          messageIds.includes(msg.id)
            ? { ...msg, read: true, readAt }
            : msg
        )
      );
    });

    socketRef.current.on('user_typing', (data) => {
      const { userId, userName } = data;

      setTypingUsers(prev => ({
        ...prev,
        [userId]: {
          name: userName,
          timestamp: Date.now()
        }
      }));
    });

    socketRef.current.on('user_stop_typing', (data) => {
      const { userId } = data;

      setTypingUsers(prev => {
        const newTypingUsers = { ...prev };
        delete newTypingUsers[userId];
        return newTypingUsers;
      });
    });

    socketRef.current.on('user_statuses', (statuses) => {
      setContacts(prev =>
        prev.map(contact => ({
          ...contact,
          online: statuses[contact.id] === 'online'
        }))
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.off('message_sent');
        socketRef.current.off('messages_read');
        socketRef.current.off('user_typing');
        socketRef.current.off('user_stop_typing');
        socketRef.current.off('user_statuses');
      }
    };
  }, [selectedContact]);

  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [loadingMessages]);

  const fetchMessages = async (parentId, studentId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://192.168.35.107:5000/teacher/chat/history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId: parentId,
          studentId: studentId
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);

        setContacts(prevContacts => {
          const updatedContacts = prevContacts.map(contact => {
            if (contact.id === parentId && contact.studentId === studentId) {
              const contactUnreadCount = contact.unread || 0;
              // Update the total unread message count
              setUnreadMessageCount(prevCount => {
                const newCount = Math.max(0, prevCount - contactUnreadCount);
                // Only clear the notification if ALL unread messages are read
                if (newCount === 0) {
                  setNewMessageAlert(false);
                }
                return newCount;
              });
              return { ...contact, unread: 0 };
            }
            return contact;
          });
          return updatedContacts;
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages: ' + error.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const acknowledgeMessages = async (parentId, studentId) => {
    try {
      const token = localStorage.getItem('token');

      await fetch('http://192.168.35.107:5000/teacher/chat/acknowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId: parentId,
          studentId: studentId
        })
      });
    } catch (error) {
      console.error('Error acknowledging messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !selectedContact || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: message,
      senderId: 'me',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessage('');
    setSendingMessage(true);

    try {
      const sent = sendMessage(selectedContact.id, selectedContact.studentId, tempMessage.text);

      if (!sent) {
        throw new Error('Failed to send message through WebSocket');
      }

      const updatedContacts = [...contacts];
      const contactIndex = updatedContacts.findIndex(
        contact => contact.id === selectedContact.id && contact.studentId === selectedContact.studentId
      );

      if (contactIndex !== -1) {
        const updatedContact = {
          ...updatedContacts[contactIndex],
          lastMessage: tempMessage.text,
          lastActive: 'Just now',
          lastActiveTime: new Date().toISOString()
        };

        updatedContacts.splice(contactIndex, 1);
        updatedContacts.unshift(updatedContact);

        setContacts(updatedContacts);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);

      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setSendingMessage(false);
    }
  };

  const handleMessageTyping = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (selectedContact && value.trim().length > 0) {
      sendTypingStatus(selectedContact.id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(selectedContact.id, false);
      }, 3000);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date)) return 'Unknown time';

      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
      });
    } catch (e) {
      return 'Unknown time';
    }
  };

  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date)) return '';

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const renderTypingIndicator = () => {
    if (selectedContact && typingUsers[selectedContact.id]) {
      return (
        <div className="text-xs text-gray-500 italic px-4 pb-1">
          {selectedContact.name} is typing...
        </div>
      );
    }
    return null;
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Use a more persistent notification banner that won't disappear on reload */}
      {newMessageAlert && (
        <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white py-2 px-4 rounded-lg shadow-lg flex items-center">
          <FaEnvelope className="mr-2" />
          <span>You have {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <FaEnvelope className="mr-3 text-primary-600" />
          Parent Communications
        </h1>
        <Link to="/teacher/dashboard" className="text-primary-600 hover:text-primary-700 flex items-center">
          <FaArrowLeft className="mr-1" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex h-[70vh]">
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-4 bg-primary-600 text-white">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search parents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredContacts.map(contact => (
                    <li
                      key={`${contact.id}-${contact.studentId}`}
                      className={`px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors duration-150 ${
                        selectedContact?.id === contact.id && selectedContact?.studentId === contact.studentId
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : contact.unread > 0
                            ? 'bg-green-50'
                            : ''
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-start">
                        <div className="relative">
                          {contact.avatar ? (
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-12 h-12 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center mr-3">
                              {getInitials(contact.name)}
                            </div>
                          )}
                          {contact.unread > 0 && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shadow-sm">
                              {contact.unread}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium truncate text-gray-900">{contact.name}</h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-1">{contact.lastActive || 'Unknown'}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{contact.role || `Parent of student in ${contact.class}`}</p>
                          {contact.lastMessage && (
                            <p className={`text-xs truncate ${contact.unread > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                              {contact.lastMessage.length > 35
                                ? contact.lastMessage.substring(0, 35) + '...'
                                : contact.lastMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {loading ? 'Loading contacts...' : 'No contacts found'}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-gray-100">
            {selectedContact ? (
              <>
                <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
                  <div className="flex items-center">
                    {selectedContact.avatar ? (
                      <img
                        src={selectedContact.avatar}
                        alt={selectedContact.name}
                        className="w-10 h-10 rounded-full mr-3 border-2 border-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white text-primary-600 flex items-center justify-center mr-3 border-2 border-white">
                        {getInitials(selectedContact.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{selectedContact.name}</h3>
                      <div className="flex items-center text-xs text-primary-100">
                        <FaCircle className="mr-1 text-green-400 h-2 w-2" />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 p-4 overflow-y-auto"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d1d5db' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundSize: '300px 300px'
                  }}
                >
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white bg-opacity-70 rounded-lg p-8">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                        <FaEnvelope className="text-primary-500 text-2xl" />
                      </div>
                      <p className="mb-2 font-medium">No messages yet</p>
                      <p className="text-sm text-center">Start the conversation by sending a message below</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => {
                        let showDateSeparator = false;
                        if (index === 0) {
                          showDateSeparator = true;
                        } else {
                          const prevDate = new Date(messages[index - 1].timestamp).toDateString();
                          const currentDate = new Date(msg.timestamp).toDateString();
                          showDateSeparator = prevDate !== currentDate;
                        }

                        return (
                          <React.Fragment key={msg.id}>
                            {showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                  {new Date(msg.timestamp).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    year: new Date().getFullYear() !== new Date(msg.timestamp).getFullYear() ? 'numeric' : undefined
                                  })}
                                </div>
                              </div>
                            )}

                            <div
                              className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                                  msg.senderId === 'me'
                                    ? 'bg-primary-100 text-gray-800 rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none'
                                }`}
                              >
                                <p className="break-words">{msg.text}</p>
                                <div className={`flex justify-end items-center text-xs mt-1 ${
                                  msg.senderId === 'me' ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  <span className="mr-1">{formatMessageTime(msg.timestamp)}</span>
                                  {msg.senderId === 'me' && (
                                    msg.read
                                      ? <FaCheckDouble className="text-green-500" />
                                      : <FaCheck className="text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {renderTypingIndicator()}

                <div className="p-3 bg-gray-50 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={handleMessageTyping}
                      placeholder="Type a message..."
                      disabled={sendingMessage}
                      className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sendingMessage}
                      className={`p-2 rounded-full ${
                        message.trim() && !sendingMessage
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
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
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-6">
                <div className="text-center bg-white rounded-lg shadow-sm p-8 max-w-md">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 text-primary-600 mb-6">
                    <FaUsers size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to Teacher Chat</h3>
                  <p className="text-gray-600 mb-6">
                    Select a conversation from the list to view and send messages to parents.
                  </p>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <p>💡 <strong>Tip:</strong> Keep in touch with parents to help their children succeed academically.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherChatPage;
