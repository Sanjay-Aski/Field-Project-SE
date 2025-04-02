import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUserCircle, FaUsers, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ChatPage = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('individual'); // 'individual' or 'group'
  const [groups, setGroups] = useState([
    { id: 1, name: 'Class 5-B Parents', unread: 2 },
    { id: 2, name: 'School Events Committee', unread: 0 },
    { id: 3, name: 'Sports Day Planning', unread: 5 }
  ]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Fetch student data and teachers when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // If studentId is provided, fetch student information
        if (studentId) {
          // Fetch student data
          const studentResponse = await fetch(`http://localhost:5000/parent/children`, {
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
          
          // Fetch teachers for this student
          const teachersResponse = await fetch(`http://localhost:5000/parent/teacher-details/${studentId}`, {
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
  
  // Fetch chat history when selected teacher changes
  const fetchChatHistory = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/parent/chat/history', {
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
      setMessages(data.messages || []);
      
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load messages');
    }
  };
  
  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      let endpoint = 'http://localhost:5000/parent/chat/send';
      let body = {
        message: newMessage,
        studentId: studentId
      };
      
      if (view === 'individual') {
        body.teacherId = selectedTeacher._id;
      } else {
        endpoint = 'http://localhost:5000/parent/chat/group/send';
        body.groupId = selectedGroup.id;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to send message: ${response.status}`);
      }
      
      // After successful API call, refresh the chat or update the UI
      if (view === 'individual' && selectedTeacher) {
        // Add optimistic update for better UX
        const tempMessage = {
          _id: Date.now().toString(),
          message: newMessage,
          timestamp: new Date(),
          isSender: true
        };
        
        setMessages(prev => [...prev, tempMessage]);
        
        // Then refresh the chat history
        fetchChatHistory(selectedTeacher._id);
      }
      
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle teacher selection
  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    fetchChatHistory(teacher._id);
  };
  
  // Handle group selection
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    // In a real app, fetch the group chat history here
    setMessages([
      { _id: 'g1', message: "Welcome to the group chat!", senderName: "Admin", timestamp: new Date(Date.now() - 86400000), isSender: false },
      { _id: 'g2', message: "When is the next meeting?", senderName: "Ananya Patel", timestamp: new Date(Date.now() - 3600000), isSender: false },
      { _id: 'g3', message: "I think it's scheduled for Friday", senderName: "You", timestamp: new Date(Date.now() - 1800000), isSender: true }
    ]);
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <Link to="/parent/dashboard" className="mt-4 inline-block text-primary-600 hover:underline">
          <FaArrowLeft className="inline mr-2" /> Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-sand min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
            <Link to="/parent/dashboard" className="mr-3 text-gray-600 hover:text-gray-800">
              <FaArrowLeft />
            </Link>
            {student ? `Chat - ${student.fullName}` : 'Messaging'}
          </h1>
          
          <div className="flex space-x-4">
            <button 
              onClick={() => setView('individual')}
              className={`px-4 py-2 rounded-md flex items-center ${
                view === 'individual' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaUserCircle className="mr-2" /> Individual
            </button>
            <button 
              onClick={() => setView('group')}
              className={`px-4 py-2 rounded-md flex items-center ${
                view === 'group' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaUsers className="mr-2" /> Groups
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-12rem)]">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-700">
                  {view === 'individual' ? 'Teachers' : 'Group Chats'}
                </h2>
              </div>
              
              <div className="overflow-y-auto">
                {view === 'individual' ? (
                  <div>
                    {teachers.map((teacher) => (
                      <div 
                        key={teacher._id}
                        onClick={() => handleTeacherSelect(teacher)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedTeacher && selectedTeacher._id === teacher._id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <FaUserCircle className="text-primary-600 text-xl" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-800">{teacher.fullName}</p>
                              <p className="text-xs text-gray-500">
                                {teacher.subjects?.join(', ') || 'No subjects'} {teacher.isClassTeacher && <span className="text-primary-600">(Class Teacher)</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {groups.map((group) => (
                      <div 
                        key={group.id}
                        onClick={() => handleGroupSelect(group)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedGroup && selectedGroup.id === group.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaUsers className="text-blue-600 text-xl" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-800">{group.name}</p>
                              <p className="text-xs text-gray-500">{group.members || '20'} members</p>
                            </div>
                          </div>
                          {group.unread > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {group.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="w-3/4 flex flex-col">
              {(view === 'individual' && selectedTeacher) || (view === 'group' && selectedGroup) ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 bg-white border-b flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        view === 'individual' ? 'bg-primary-100' : 'bg-blue-100'
                      }`}>
                        {view === 'individual' ? (
                          <FaUserCircle className="text-primary-600 text-xl" />
                        ) : (
                          <FaUsers className="text-blue-600 text-xl" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-800">
                          {view === 'individual' ? selectedTeacher.fullName : selectedGroup.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {view === 'individual' 
                            ? (selectedTeacher.isClassTeacher ? 'Class Teacher' : selectedTeacher.subjects?.join(', '))
                            : `${selectedGroup.members || '20'} members`
                          }
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaEllipsisV />
                    </button>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="mb-2">No messages yet</p>
                        <p className="text-sm">Start the conversation by sending a message below</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div 
                            key={msg._id}
                            className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                              msg.isSender 
                                ? 'bg-primary-100 text-secondary-800' 
                                : 'bg-white border border-gray-200 text-gray-800'
                            }`}>
                              {!msg.isSender && (
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  {msg.senderName || (view === 'individual' ? selectedTeacher.fullName : 'Unknown')}
                                </p>
                              )}
                              <p className="break-words">{msg.message}</p>
                              <p className="text-xs text-gray-500 text-right mt-1">
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 bg-white border-t">
                    <form onSubmit={sendMessage} className="flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button 
                        type="submit"
                        className="bg-primary-600 text-white py-2 px-4 rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        <FaPaperPlane />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="mb-2">Select a {view === 'individual' ? 'teacher' : 'group'} to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;