import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaCalendarCheck, FaCalendarTimes, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const StudentAttendance = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // First fetch student details
        const studentResponse = await fetch(`http://192.168.103.107:5000/parent/children`, {
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
        
        // Then fetch attendance data
        const attendanceResponse = await fetch(`http://192.168.103.107:5000/parent/attendance/${studentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!attendanceResponse.ok) {
          throw new Error(`Failed to fetch attendance data: ${attendanceResponse.status}`);
        }
        
        const attendanceResult = await attendanceResponse.json();
        
        if (!attendanceResult || !attendanceResult.attendance || !Array.isArray(attendanceResult.attendance)) {
          setAttendanceData([]);
          setMonths([]);
          setLoading(false);
          return;
        }
        
        // Format the attendance data
        const formattedAttendance = attendanceResult.attendance.map(item => ({
          month: item.month,
          presentDates: item.presentDates || [],
          absentDates: item.absentDates || [],
          presentpercent: item.presentpercent || 0
        }));
        
        setAttendanceData(formattedAttendance);
        
        // Extract months from attendance data
        const monthsList = formattedAttendance.map(item => item.month);
        setMonths(monthsList);
        
        if (monthsList.length > 0) {
          setSelectedMonth(monthsList[0]);
        }
        
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError(err.message || 'Failed to load attendance data');
        toast.error('Could not load attendance data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [studentId]);
  
  const selectedMonthData = attendanceData.find(item => item.month === selectedMonth);
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
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
        <Link to="/parent/dashboard" className="mt-4 text-primary-600 hover:underline flex items-center">
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <FaCalendarAlt className="mr-3 text-primary-600" />
          {student ? `${student.fullName}'s Attendance` : 'Student Attendance'}
        </h1>
        <Link to="/parent/dashboard" className="text-primary-600 hover:text-primary-700 flex items-center">
          <FaArrowLeft className="mr-1" /> Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {student && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-secondary-700">Student Information</h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">{student.fullName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium text-gray-800">{student.class}-{student.division}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Roll Number</p>
                  <p className="font-medium text-gray-800">{student.roll}</p>
                </div>
              </div>
            </div>
          )}
          
          {attendanceData.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <FaExclamationCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Attendance Records</h3>
              <p className="mt-2 text-gray-500">Attendance records for this student are not available yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedMonthData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FaCalendarCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-green-800">Present Days</h3>
                          <p className="text-xl font-bold text-green-600">{selectedMonthData.presentDates.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <FaCalendarTimes className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-red-800">Absent Days</h3>
                          <p className="text-xl font-bold text-red-600">{selectedMonthData.absentDates.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaCalendarAlt className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-blue-800">Attendance Percentage</h3>
                          <p className="text-xl font-bold text-blue-600">
                            {selectedMonthData.presentpercent ? selectedMonthData.presentpercent.toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Present Dates <span className="text-sm text-gray-500">({selectedMonthData.presentDates.length} days)</span>
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedMonthData.presentDates.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedMonthData.presentDates.map((date, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                                {formatDate(date)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No present dates recorded for this month.</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Absent Dates <span className="text-sm text-gray-500">({selectedMonthData.absentDates.length} days)</span>
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedMonthData.absentDates.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedMonthData.absentDates.map((date, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-md">
                                {formatDate(date)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No absent dates recorded for this month.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Calendar View */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Monthly Calendar View</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center font-medium text-gray-500 text-sm p-1">
                            {day}
                          </div>
                        ))}
                        
                        {/* Generate calendar days */}
                        {(() => {
                          // Extract month and year from the selected month string (e.g., "May 2025")
                          const [monthName, yearStr] = selectedMonth.split(' ');
                          const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth();
                          const year = parseInt(yearStr);
                          
                          // Create a date for the first day of the month
                          const firstDay = new Date(year, monthIndex, 1);
                          // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
                          const firstDayOfWeek = firstDay.getDay();
                          
                          // Get the number of days in the month
                          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                          
                          // Create an array of day elements
                          const days = [];
                          
                          // Add empty cells for days before the first day of the month
                          for (let i = 0; i < firstDayOfWeek; i++) {
                            days.push(
                              <div key={`empty-${i}`} className="text-center p-2"></div>
                            );
                          }
                          
                          // Present and absent dates for quick lookup
                          const presentSet = new Set(
                            selectedMonthData.presentDates.map(date => new Date(date).getDate())
                          );
                          const absentSet = new Set(
                            selectedMonthData.absentDates.map(date => new Date(date).getDate())
                          );
                          
                          // Add the days of the month
                          for (let day = 1; day <= daysInMonth; day++) {
                            let bgColor = 'bg-gray-100';
                            let textColor = 'text-gray-600';
                            
                            if (presentSet.has(day)) {
                              bgColor = 'bg-green-100';
                              textColor = 'text-green-800';
                            } else if (absentSet.has(day)) {
                              bgColor = 'bg-red-100';
                              textColor = 'text-red-800';
                            }
                            
                            days.push(
                              <div 
                                key={day} 
                                className={`text-center p-2 ${bgColor} ${textColor} rounded-md font-medium`}
                              >
                                {day}
                              </div>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-100 rounded-full"></div>
                          <span className="ml-1 text-gray-600">Present</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-100 rounded-full"></div>
                          <span className="ml-1 text-gray-600">Absent</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-100 rounded-full"></div>
                          <span className="ml-1 text-gray-600">Not Recorded</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No data available for the selected month.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
