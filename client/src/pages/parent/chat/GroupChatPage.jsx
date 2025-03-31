import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUsers, FaPlus, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

const GroupChatPage = () => {
  const [groups, setGroups] = useState([
    { id: 1, name: 'Class 5-B Parents', members: 24, lastMessage: 'Please remember to submit the consent forms', lastActive: '10 min ago', unread: 2 },
    { id: 2, name: 'School Events Committee', members: 12, lastMessage: 'We need volunteers for the annual day', lastActive: '2 hours ago', unread: 0 },
    { id: 3, name: 'Sports Day Planning', members: 15, lastMessage: 'The event is scheduled for next month', lastActive: '1 day ago', unread: 5 },
    { id: 4, name: 'PTA General', members: 45, lastMessage: 'Next meeting is on Monday', lastActive: '3 days ago', unread: 0 }
  ]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom of messages when they change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setLoading(true);
    
    // Mock message loading
    setTimeout(() => {
      setMessages([
        { id: 1, text: 'Welcome to the group chat!', sender: 'Admin', timestamp: '2 days ago', isSelf: false },
        { id: 2, text: 'Hello everyone!', sender: 'John Smith', timestamp: '1 day ago', isSelf: false },
        { id: 3, text: 'Looking forward to collaborating with all of you.', sender: 'You', timestamp: '1 day ago', isSelf: true },
        { id: 4, text: group.lastMessage, sender: 'Sarah Wilson', timestamp: group.lastActive, isSelf: false }
      ]);
      setLoading(false);
      
      // Reset unread count
      setGroups(groups.map(g => 
        g.id === group.id ? { ...g, unread: 0 } : g
      ));
    }, 800);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;
    
    // Add message to UI
    const newMsg = {
      id: Date.now(),
      text: newMessage,
      sender: 'You',
      timestamp: 'Just now',
      isSelf: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Update last message in groups list
    setGroups(groups.map(g => 
      g.id === selectedGroup.id ? { ...g, lastMessage: newMessage, lastActive: 'Just now' } : g
    ));
    
    // Mock API call
    toast.success('Message sent');
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Link to="/parent/dashboard" className="mr-3 text-gray-600 hover:text-gray-900">
              <FaArrowLeft />
            </Link>
            Group Discussions
          </h1>
          
          <button className="flex items-center py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <FaPlus className="mr-2" /> Join Group
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex h-[70vh]">
            {/* Groups List */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-10 py-2 border border-gray-300 rounded-lg"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              
              <div className="overflow-y-auto h-full">
                {filteredGroups.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredGroups.map(group => (
                      <div 
                        key={group.id} 
                        className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedGroup?.id === group.id ? 'bg-primary-50' : ''}`}
                        onClick={() => handleGroupSelect(group)}
                      >
                        <div className="flex">
                          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FaUsers className="text-primary-600" />
                          </div>
                          <div className="ml-3 flex-grow">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-900">{group.name}</h3>
                              {group.unread > 0 && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                  {group.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{group.lastMessage}</p>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-gray-400">{group.members} members</span>
                              <span className="text-xs text-gray-400">{group.lastActive}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No groups found</div>
                )}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
              {selectedGroup ? (
                <>
                  {/* Group Header */}
                  <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <FaUsers className="text-primary-600" />
                      </div>
                      <div>
                        <h2 className="font-medium text-gray-900">{selectedGroup.name}</h2>
                        <p className="text-sm text-gray-500">{selectedGroup.members} members</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(message => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                                message.isSelf 
                                  ? 'bg-primary-100 text-gray-800' 
                                  : 'bg-white border border-gray-200 text-gray-800'
                              }`}
                            >
                              {!message.isSelf && (
                                <p className="text-xs font-medium text-gray-600 mb-1">{message.sender}</p>
                              )}
                              <p>{message.text}</p>
                              <p className="text-xs text-gray-500 text-right mt-1">{message.timestamp}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button 
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`py-2 px-4 rounded-r-md ${
                          newMessage.trim() 
                            ? 'bg-primary-600 text-white hover:bg-primary-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <FaPaperPlane />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Select a group to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatPage;
