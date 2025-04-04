import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaPaperPlane, FaSearch, FaEllipsisV, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TeacherChatPage = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Fetch parent contacts when component mounts
  useEffect(() => {
    fetchContacts();
    fetchUnreadCounts();
    
    // Poll for unread counts every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Fetch chat history when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchChatHistory();
      acknowledgeMessages();
    }
  }, [selectedContact]);
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/teacher/parent-contacts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.contacts) {
        setContacts(data.contacts);
        
        // Select the first contact by default if available
        if (data.contacts.length > 0 && !selectedContact) {
          setSelectedContact(data.contacts[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/teacher/unread-messages-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch unread counts: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.unreadData) {
        // Convert the array to an object with parentId+studentId as key
        const counts = {};
        data.unreadData.forEach(item => {
          const key = `${item.parentId}_${item.studentId}`;
          counts[key] = {
            count: item.unreadCount,
            lastMessage: item.lastMessage,
            timestamp: item.timestamp
          };
        });
        
        setUnreadCounts(counts);
        
        // Update contacts list with unread counts
        setContacts(prev => prev.map(contact => {
          const key = `${contact.id}_${contact.studentId}`;
          return {
            ...contact,
            unread: counts[key]?.count || 0,
            lastMessage: counts[key]?.lastMessage || contact.lastMessage
          };
        }));
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };
  
  const fetchChatHistory = async () => {
    if (!selectedContact) return;
    
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/teacher/get-chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parentId: selectedContact.id,
          studentId: selectedContact.studentId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const acknowledgeMessages = async () => {
    if (!selectedContact) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await fetch('http://localhost:5000/teacher/acknowledge-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parentId: selectedContact.id,
          studentId: selectedContact.studentId
        })
      });
      
      // Update unread counts after acknowledgment
      fetchUnreadCounts();
      
    } catch (error) {
      console.error('Error acknowledging messages:', error);
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedContact) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/teacher/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parentId: selectedContact.id,
          studentId: selectedContact.studentId,
          message: message.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.chatMessage) {
        // Add the new message to the messages list
        setMessages(prev => [...prev, data.chatMessage]);
        setMessage(''); // Clear input
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.class.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today: show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week: show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older: show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Left sidebar with contacts */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          <p className="text-sm text-gray-500">Communicate with parents</p>
          
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Search parents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map(contact => (
              <div
                key={`${contact.id}_${contact.studentId}`}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex items-center ${
                  selectedContact && 
                  selectedContact.id === contact.id && 
                  selectedContact.studentId === contact.studentId ? 
                  'bg-primary-50' : ''
                }`}
                onClick={() => setSelectedContact(contact)}
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <FaUserCircle className="text-primary-600 text-xl" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-800">{contact.name}</h3>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(contact.lastActive)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{contact.role}</p>
                  <p className="text-xs text-gray-400">Class: {contact.class}</p>
                </div>
                {contact.unread > 0 && (
                  <div className="ml-2 bg-primary-500 text-white rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs">
                    {contact.unread}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No contacts found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right side with messages */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        {selectedContact ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white border-b flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <FaUserCircle className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{selectedContact.name}</h3>
                  <p className="text-sm text-gray-500">{selectedContact.role}</p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                <FaEllipsisV />
              </button>
            </div>
            
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ backgroundImage: 'url("/assets/chat-bg-light.png")' }}
            >
              {loadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : messages.length > 0 ? (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderId === 'me' 
                          ? 'bg-primary-100 text-primary-900' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        {msg.senderId === 'me' && (
                          msg.read ? 
                            <FaCheckDouble className="text-xs text-blue-500" /> : 
                            <FaCheck className="text-xs text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
            
            {/* Message input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className={`ml-3 p-2 rounded-full ${
                  message.trim() ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaUserCircle className="text-gray-300 text-5xl mb-4" />
            <p className="text-lg">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherChatPage;
