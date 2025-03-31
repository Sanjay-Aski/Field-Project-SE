import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPaperPlane, FaUsers, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
  
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/teacher/chat/contacts', {
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
          setContacts(data.contacts);
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
  }, []);
  
  useEffect(() => {
    // Scroll to bottom of messages when they change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id, selectedContact.studentId);
    }
  }, [selectedContact]);
  
  const fetchMessages = async (parentId, studentId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/teacher/chat/history', {
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
        
        // Update unread count for this contact
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.id === parentId 
              ? { ...contact, unread: 0 } 
              : contact
          )
        );
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
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedContact || sendingMessage) return;
    
    // Optimistically add message to UI with a temporary ID
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      text: message,
      senderId: 'me',
      timestamp: new Date().toISOString(),
      senderName: 'You'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSendingMessage(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/teacher/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId: selectedContact.id,
          studentId: selectedContact.studentId,
          message: newMessage.text
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Replace the temporary message with the real one from the server
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...data.chatMessage, text: data.chatMessage.text } : msg
        ));
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
      
      // Remove the optimistically added message if it fails
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSendingMessage(false);
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
      
      return date.toLocaleDateString();
    } catch (e) {
      return 'Unknown time';
    }
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
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Parent Communications</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex h-[70vh]">
          {/* Contacts List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search parents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                      key={contact.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedContact?.id === contact.id ? 'bg-primary-50' : ''}`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-start">
                        <div className="relative">
                          {contact.avatar ? (
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center mr-3">
                              {getInitials(contact.name)}
                            </div>
                          )}
                          {contact.unread > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {contact.unread}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium truncate">{contact.name}</h3>
                            <span className="text-xs text-gray-500">{contact.lastActive || 'Unknown'}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{contact.role}</p>
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
          
          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center">
                    {selectedContact.avatar ? (
                      <img
                        src={selectedContact.avatar}
                        alt={selectedContact.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center mr-3">
                        {getInitials(selectedContact.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{selectedContact.name}</h3>
                      <p className="text-xs text-gray-500">{selectedContact.role}</p>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p className="mb-2">No messages yet</p>
                      <p className="text-sm">Start the conversation by sending a message</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-lg ${
                              msg.senderId === 'me'
                                ? 'bg-primary-500 text-white rounded-br-none'
                                : 'bg-white border border-gray-200 rounded-bl-none'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <div
                              className={`text-xs mt-1 ${
                                msg.senderId === 'me' ? 'text-primary-100' : 'text-gray-500'
                              }`}
                            >
                              {typeof msg.timestamp === 'string' ? formatTimestamp(msg.timestamp) : 'Unknown time'}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sendingMessage}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sendingMessage}
                      className={`px-4 py-2 rounded-lg ${
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
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <FaUsers size={28} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-1">Select a conversation</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a parent from the list to start or continue a conversation.
                  </p>
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
