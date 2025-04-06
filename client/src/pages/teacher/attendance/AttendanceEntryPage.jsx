import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaFileExcel, FaCalendarCheck, FaCalendarWeek, FaCalendarDay } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const AttendanceEntryPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('May 2025');
  const [workingDays, setWorkingDays] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [activeTab, setActiveTab] = useState('mark-attendance');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [error, setError] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [monthsData, setMonthsData] = useState([
    'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025'
  ]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [unauthorizedError, setUnauthorizedError] = useState(null);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [daysInCurrentMonth, setDaysInCurrentMonth] = useState([]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  useEffect(() => {
    const classParam = queryParams.get('class');
    const divisionParam = queryParams.get('division');

    if (classParam) setSelectedClass(classParam);
    if (divisionParam) setSelectedDivision(divisionParam);

    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDivision && teacher) {
      setUnauthorizedError(null);
      fetchStudents();
      if (activeTab === 'working-days') {
        fetchWorkingDays();
      } else if (activeTab === 'view-attendance') {
        fetchAttendanceStats();
      }
    }
  }, [selectedClass, selectedDivision, selectedMonth, activeTab, teacher]);

  const fetchTeacherProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/teacher/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher profile: ${response.status}`);
      }

      const data = await response.json();
      setTeacher(data.teacher);
      setIsClassTeacher(true);

      if (selectedClass && selectedDivision) {
        setUnauthorizedError(null);
      } else if (data.teacher.classTeacher && data.teacher.classTeacher.class) {
        setSelectedClass(data.teacher.classTeacher.class.toString());
        setSelectedDivision(data.teacher.classTeacher.division);
      }

      const classesSet = new Set();

      data.teacher.subjects.forEach(subject => {
        classesSet.add(JSON.stringify({ class: subject.class, division: subject.division }));
      });

      if (data.teacher.classTeacher && data.teacher.classTeacher.class) {
        classesSet.add(JSON.stringify({
          class: data.teacher.classTeacher.class,
          division: data.teacher.classTeacher.division
        }));
      }

      const uniqueClasses = Array.from(classesSet).map(item => JSON.parse(item));
      setClasses(uniqueClasses);

      if ((!selectedClass || !selectedDivision) && uniqueClasses.length > 0) {
        if (!selectedClass) setSelectedClass(uniqueClasses[0].class.toString());
        if (!selectedDivision) setSelectedDivision(uniqueClasses[0].division);
      }

    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      setError(error.message);
      toast.error('Failed to load teacher profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingAttendance(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/teacher/class-students?class=${selectedClass}&division=${selectedDivision}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }

      const data = await response.json();
      setStudents(data);

      const initialAttendance = {};
      data.forEach(student => {
        initialAttendance[student._id] = true;
      });
      setAttendance(initialAttendance);

    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students. Please try again.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchWorkingDays = async () => {
    try {
      setLoadingAttendance(true);
      const token = localStorage.getItem('token');

      const [monthName, yearStr] = selectedMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth();
      const year = parseInt(yearStr);
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        days.push(dateStr);
      }
      
      setCalendarDays(days);

      const response = await fetch(`http://localhost:5000/teacher/working-days?month=${encodeURIComponent(selectedMonth)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch working days: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.workingDays && Array.isArray(data.workingDays)) {
        setWorkingDays(data.workingDays);
      } else {
        const defaultWorkingDays = days.filter(day => {
          const date = new Date(day);
          return date.getDay() !== 0 && date.getDay() !== 6;
        });
        setWorkingDays(defaultWorkingDays);
      }
      
    } catch (error) {
      console.error('Error fetching working days:', error);
      toast.error('Failed to load working days. Please try again.');
      
      const defaultWorkingDays = calendarDays.filter(day => {
        const date = new Date(day);
        return date.getDay() !== 0 && date.getDay() !== 6;
      });
      setWorkingDays(defaultWorkingDays);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setLoadingAttendance(true);
      const token = localStorage.getItem('token');
      
      if (!selectedClass || !selectedDivision || !selectedMonth) {
        toast.error('Please select class, division and month');
        setLoadingAttendance(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/teacher/monthly-attendance?classNum=${selectedClass}&division=${selectedDivision}&month=${encodeURIComponent(selectedMonth)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch attendance data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.attendanceStats)) {
        setAttendanceStats(data.attendanceStats);
      } else {
        setAttendanceStats([]);
        toast.info('No attendance records found for this month');
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      toast.error('Failed to load attendance statistics. Please try again.');
      setAttendanceStats([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleAttendanceChange = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSubmitAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const token = localStorage.getItem('token');

      const attendancePromises = Object.entries(attendance).map(async ([studentId, isPresent]) => {
        if (isPresent) {
          const requestData = {
            studentId,
            month: selectedMonth,
            presentDates: [selectedDate]
          };

          const response = await fetch('http://localhost:5000/teacher/assign-attendance', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to save attendance for student ${studentId}`);
          }

          return { studentId, success: true };
        }
        return { studentId, success: false, reason: 'Absent' };
      });

      await Promise.all(attendancePromises);

      toast.success('Attendance submitted successfully!');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error(`Failed to submit attendance: ${error.message}`);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      let endpoint = '';

      if (activeTab === 'upload-attendance') {
        endpoint = 'http://localhost:5000/teacher/assign-attendance-excel';
      } else if (activeTab === 'working-days') {
        endpoint = 'http://localhost:5000/teacher/set-working-days-excel';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file');
      }

      const result = await response.json();

      toast.success('File uploaded and processed successfully!');

      if (activeTab === 'upload-attendance') {
        fetchAttendanceStats();
      } else if (activeTab === 'working-days') {
        fetchWorkingDays();
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleWorkingDayToggle = (dateString) => {
    setWorkingDays(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(date => date !== dateString);
      } else {
        return [...prev, dateString];
      }
    });
  };

  const handleSetWorkingDays = async () => {
    try {
      setLoadingAttendance(true);
      const token = localStorage.getItem('token');

      const requestData = {
        month: selectedMonth,
        workingDays,
        class: selectedClass,
        division: selectedDivision
      };

      const response = await fetch('http://localhost:5000/teacher/set-working-days', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set working days');
      }

      const data = await response.json();
      toast.success('Working days set successfully!');
      
      if (data.workingDays) {
        setWorkingDays(data.workingDays);
      }
    } catch (error) {
      console.error('Error setting working days:', error);
      toast.error(`Failed to set working days: ${error.message}`);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const downloadAttendanceTemplate = (templateType) => {
    if (!selectedClass || !selectedDivision) {
      toast.error('Please select class and division first');
      return;
    }

    setIsDownloading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to download templates');
      setIsDownloading(false);
      return;
    }

    const queryParams = new URLSearchParams({
      class: selectedClass,
      division: selectedDivision,
      type: templateType
    });

    fetch(`http://localhost:5000/teacher/attendance-template?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to download template');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `attendance-template-${templateType}-${selectedClass}-${selectedDivision}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} attendance template downloaded successfully`);
      })
      .catch(error => {
        console.error('Error downloading template:', error);
        toast.error('Failed to download template');
      })
      .finally(() => {
        setIsDownloading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (unauthorizedError) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <p className="font-semibold">Access Restricted</p>
        <p>{unauthorizedError}</p>
        <Link to="/teacher/dashboard" className="mt-4 text-primary-600 hover:underline flex items-center">
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <Link to="/teacher/dashboard" className="mt-4 text-primary-600 hover:underline flex items-center">
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
          Attendance Management
        </h1>
        <Link to="/teacher/dashboard" className="text-primary-600 hover:text-primary-700 flex items-center">
          <FaArrowLeft className="mr-1" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                {monthsData.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {activeTab === 'mark-attendance' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="border-b">
          <nav className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('mark-attendance')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'mark-attendance'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setActiveTab('upload-attendance')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'upload-attendance'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Attendance
            </button>
            <button
              onClick={() => setActiveTab('working-days')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'working-days'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Set Working Days
            </button>
            <button
              onClick={() => setActiveTab('view-attendance')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'view-attendance'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              View Monthly Attendance
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loadingAttendance ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              {activeTab === 'mark-attendance' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Mark Attendance for {selectedDate}
                  </h2>

                  {students.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Roll No.
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attendance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                              <tr key={student._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.roll}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex justify-center space-x-4">
                                    <button
                                      onClick={() => handleAttendanceChange(student._id)}
                                      className={`px-3 py-1 rounded-md flex items-center ${
                                        attendance[student._id]
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      <FaCheckCircle className={`mr-1 ${attendance[student._id] ? 'text-green-600' : 'text-gray-400'}`} />
                                      Present
                                    </button>
                                    <button
                                      onClick={() => handleAttendanceChange(student._id)}
                                      className={`px-3 py-1 rounded-md flex items-center ${
                                        !attendance[student._id]
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      <FaTimesCircle className={`mr-1 ${!attendance[student._id] ? 'text-red-600' : 'text-gray-400'}`} />
                                      Absent
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSubmitAttendance}
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Submit Attendance
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No students found in this class. Please select a different class or division.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'upload-attendance' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Upload Attendance from Excel
                  </h2>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center mb-4">
                      <FaFileExcel className="text-green-600 text-xl mr-2" />
                      <span className="font-medium">Upload Excel File</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Upload an Excel file with your attendance data. The file should have the following columns:
                      Student ID, Month, Present Dates.
                    </p>

                    <input
                      type="file"
                      id="attendanceFile"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <FaFileExcel className="text-gray-400 text-4xl mb-4" />
                      <p className="text-sm text-gray-600 mb-2">Drag and drop an Excel file here, or click to browse</p>
                      <label
                        htmlFor="attendanceFile"
                        className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
                      >
                        {isUploading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </span>
                        ) : (
                          'Select File'
                        )}
                      </label>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3">Download Templates</h3>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => downloadAttendanceTemplate('weekly')}
                          disabled={isDownloading}
                          className="text-primary-600 hover:text-primary-700 flex items-center border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md px-3 py-2 text-sm transition-colors"
                        >
                          <FaCalendarWeek className="mr-1" />
                          {isDownloading ? 'Downloading...' : 'Weekly Template'}
                        </button>
                        
                        <button 
                          onClick={() => downloadAttendanceTemplate('monthly')}
                          disabled={isDownloading}
                          className="text-primary-600 hover:text-primary-700 flex items-center border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md px-3 py-2 text-sm transition-colors"
                        >
                          <FaCalendarDay className="mr-1" />
                          {isDownloading ? 'Downloading...' : 'Monthly Template'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'working-days' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Set Working Days for {selectedMonth}
                  </h2>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                      Mark the days in the selected month that are working days. These days will be used for calculating attendance percentages.
                    </p>

                    <div className="grid grid-cols-7 gap-2 mb-6">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(dayName => (
                        <div 
                          key={dayName} 
                          className="p-2 text-center font-medium text-gray-700 bg-gray-200 rounded-md"
                        >
                          {dayName}
                        </div>
                      ))}
                      
                      {(() => {
                        const [monthName, yearStr] = selectedMonth.split(' ');
                        const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth();
                        const year = parseInt(yearStr);
                        const firstDay = new Date(year, monthIndex, 1);
                        const firstDayOfWeek = firstDay.getDay();
                        
                        return Array.from({ length: firstDayOfWeek }).map((_, index) => (
                          <div key={`empty-start-${index}`} className="p-3 rounded-md"></div>
                        ));
                      })()}
                      
                      {calendarDays.map(dateString => {
                        const day = new Date(dateString).getDate();
                        const isWorkingDay = workingDays.includes(dateString);

                        return (
                          <div
                            key={dateString}
                            onClick={() => handleWorkingDayToggle(dateString)}
                            className={`p-3 rounded-md text-center cursor-pointer ${
                              isWorkingDay
                                ? 'bg-primary-100 border border-primary-300 text-primary-800'
                                : 'bg-gray-100 border border-gray-300 text-gray-600'
                            }`}
                          >
                            <div className="font-medium">{day}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded-sm"></div>
                        <span className="ml-2 text-sm text-gray-600">Working Day</span>
                      </div>
                      <div className="flex items-center ml-6">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded-sm"></div>
                        <span className="ml-2 text-sm text-gray-600">Non-Working Day</span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSetWorkingDays}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Save Working Days
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaFileExcel className="text-green-600 text-xl mr-2" />
                        <span className="font-medium">Upload Working Days Excel</span>
                      </div>
                      
                      <button
                        onClick={() => downloadAttendanceTemplate('monthly')}
                        className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                        disabled={isDownloading}
                      >
                        <FaFileExcel className="mr-1" />
                        {isDownloading ? 'Downloading...' : 'Download Template'}
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Alternatively, you can upload a prepared Excel file with working days information.
                    </p>

                    <input
                      type="file"
                      id="workingDaysFile"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <label
                      htmlFor="workingDaysFile"
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Excel File'}
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'view-attendance' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Monthly Attendance for {selectedMonth}
                    </h2>
                    <button
                      onClick={fetchAttendanceStats}
                      className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                    >
                      Refresh Data
                    </button>
                  </div>
                  
                  {attendanceStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Roll No.
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Present Days
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Absent Days
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendanceStats.map((student) => {
                            const totalDays = student.attendance.present + student.attendance.absent;
                            const attendancePercentage = totalDays > 0
                              ? (student.attendance.present / totalDays) * 100
                              : 0;

                            return (
                              <tr key={student._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.roll}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                                  {student.attendance.present}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                                  {student.attendance.absent}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    attendancePercentage >= 90
                                      ? 'bg-green-100 text-green-800'
                                      : attendancePercentage >= 75
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {attendancePercentage.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No attendance data available for this class and month. Mark attendance first or select a different period.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceEntryPage;
