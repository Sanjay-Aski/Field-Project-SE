import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPaperPlane, FaUserCircle, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
  const messagesEndRef = useRef(null);
  
  // Fetch student data and teachers when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
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
        
        // Ensure each teacher has _id property
        if (Array.isArray(teachersData)) {
          setTeachers(teachersData);
        } else {
          console.error('Unexpected teacher data format:', teachersData);
          throw new Error('Invalid teacher data format received from server');
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError(error.message);
        toast.error('Failed to load chat data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [studentId]);
  
  // Fetch chat history when selected teacher changes
  useEffect(() => {
    if (selectedTeacher && selectedTeacher._id) {
      fetchChatHistory(selectedTeacher._id);
    }
  }, [selectedTeacher]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchChatHistory = async (teacherId) => {
    try {
      if (!teacherId || !studentId) {
        toast.error('Teacher or student information is missing');
        return;
      }
      
      setLoadingMessages(true);
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
      
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load messages: ' + error.message);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedTeacher || sendingMessage) return;
    
    // Optimistically add message to UI with a temporary ID
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      message: newMessage,
      timestamp: new Date(),
      isSender: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSendingMessage(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/parent/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: selectedTeacher._id,
          studentId: studentId,
          message: newMessage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to send message: ${response.status}`);
      }
      
      // Successfully sent, refresh the chat history to get the real message ID
      await fetchChatHistory(selectedTeacher._id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
      
      // Remove the optimistically added message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date)) return 'Unknown time';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Unknown time';
    }
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
    <div className="container mx-auto p-4">
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
          {/* Teacher List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-700">Teachers</h2>
            </div>
            
            <div className="overflow-y-auto">
              {teachers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No teachers found</div>
              ) : (
                teachers.map((teacher) => (
                  <div 
                    key={teacher._id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedTeacher && selectedTeacher._id === teacher._id ? 'bg-primary-50' : ''
                    }`}
                  >
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
                ))
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="w-2/3 flex flex-col">
            {selectedTeacher ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FaUserCircle className="text-primary-600 text-xl" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">{selectedTeacher.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {selectedTeacher.isClassTeacher ? 'Class Teacher' : selectedTeacher.subjects?.join(', ')}
                      </p>
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
                      <p className="text-sm">Start the conversation by sending a message below</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        console.log("Message data:", msg);
                        
                        const isParentSender = msg.senderModel === 'Parent' || msg.isSender === true;
                        
                        return (
                          <div 
                            key={msg._id}
                            className={`flex ${isParentSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                              isParentSender 
                                ? 'bg-primary-100 text-secondary-800 rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                              {!isParentSender && (
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  {/* {msg.senderName || selectedTeacher?.fullName || 'Teacher'} */}
                                </p>
                              )}
                              <p className="break-words">{msg.message}</p>
                              <p className="text-xs text-gray-500 text-right mt-1">
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
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
