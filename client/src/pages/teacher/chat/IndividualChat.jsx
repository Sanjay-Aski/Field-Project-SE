import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaPaperPlane, FaEllipsisV, FaPhone, FaVideo, FaUser, FaComment } from 'react-icons/fa';
import { toast } from 'react-toastify';

const IndividualChat = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch unread counts and update contacts
        const response = await fetch('http://192.168.35.107:5000/teacher/chat/unread-counts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.unreadData) {
            // Update contacts with unread counts and latest messages
            setContacts(prevContacts => {
              return prevContacts.map(contact => {
                const matchingData = data.unreadData.find(
                  item => item.parentId === contact.id &&
                          (item.studentId === contact.studentId)
                );

                if (matchingData) {
                  return {
                    ...contact,
                    unread: matchingData.unreadCount || 0,
                    lastMessage: matchingData.lastMessage || contact.lastMessage,
                    lastActive: matchingData.timestamp ? 
                       formatTimestamp(matchingData.timestamp) : contact.lastActive
                  };
                }
                return contact;
              }).sort((a, b) => {
                // Sort by unread messages first, then by last active time
                if (a.unread !== b.unread) return b.unread - a.unread;
                if (a.lastActiveTime && b.lastActiveTime) {
                  return new Date(b.lastActiveTime) - new Date(a.lastActiveTime);
                }
                return 0;
              });
            });
          }
        }
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };

    fetchContacts();

    // Set up an interval to refresh contacts and their unread counts
    const interval = setInterval(fetchContacts, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll to bottom of messages when they change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  const fetchMessages = async (contactId) => {
    try {
      setLoading(true);

      // In a real app, fetch messages from API
      setTimeout(() => {
        const mockMessages = [
          { id: 1, senderId: contactId, text: 'Hello teacher, I wanted to ask about the homework assignment.', timestamp: '10:23 AM' },
          { id: 2, senderId: 'me', text: 'Hi there! Sure, what questions do you have?', timestamp: '10:24 AM' },
          { id: 3, senderId: contactId, text: 'My child is having difficulty with the math problems.', timestamp: '10:26 AM' },
          { id: 4, senderId: contactId, text: 'Especially the algebra section.', timestamp: '10:26 AM' },
          { id: 5, senderId: 'me', text: 'I understand. The algebra section can be challenging. Would you like me to provide some additional resources or perhaps schedule a time for extra help?', timestamp: '10:30 AM' },
          { id: 6, senderId: contactId, text: 'Additional resources would be great!', timestamp: '10:32 AM' },
          { id: 7, senderId: 'me', text: 'Perfect! I\'ll send over some practice problems and video tutorials that should help.', timestamp: '10:35 AM' },
        ];
        setMessages(mockMessages);
        setLoading(false);
      }, 500);

      // Update unread count for this contact
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === contactId 
            ? { ...contact, unread: 0 } 
            : contact
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !selectedContact) return;

    // Optimistically add message to UI
    const newMessage = {
      id: Date.now(),
      senderId: 'me',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    try {
      // In a real app, send message to API
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');

      // Remove the optimistically added message if it fails
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
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

  if (loading && contacts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary-800 mb-6">Individual Chats</h1>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex h-[70vh]">
          {/* Contacts List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contacts..."
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
                            <span className="text-xs text-gray-500">{contact.lastActive}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No contacts found
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
                      <p className="text-xs text-gray-500">{selectedContact.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaPhone />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaVideo />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
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
                              {msg.timestamp}
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
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className={`px-4 py-2 rounded-lg ${
                        message.trim()
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <FaComment size={28} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-1">Select a conversation</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose from your existing conversations or start a new one.
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

export default IndividualChat;
