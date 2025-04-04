import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaFileExcel, FaBook, FaEye, FaCheck, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MarksheetPage = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [classes, setClasses] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marksheetData, setMarksheetData] = useState([]);
  const [examTypes, setExamTypes] = useState(['Unit-I','Semester-I', 'Unit-II', 'Semester-II']);
  const [activeTab, setActiveTab] = useState('view');
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDivision) {
      fetchClassMarksheets();
    }
  }, [selectedClass, selectedDivision, selectedExamType]);

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
      
      // Extract unique classes taught by this teacher
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
      
      // Set default selection if teacher is a class teacher
      if (data.teacher.classTeacher && data.teacher.classTeacher.class) {
        setSelectedClass(data.teacher.classTeacher.class.toString());
        setSelectedDivision(data.teacher.classTeacher.division);
      } else if (uniqueClasses.length > 0) {
        // Otherwise select the first available class
        setSelectedClass(uniqueClasses[0].class.toString());
        setSelectedDivision(uniqueClasses[0].division);
      }
      
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      setError(error.message);
      toast.error('Failed to load teacher profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassMarksheets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `http://localhost:5000/teacher/class-marksheets?classNum=${selectedClass}&division=${selectedDivision}`;
      
      if (selectedExamType) {
        url += `&examType=${encodeURIComponent(selectedExamType)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch marksheets: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMarksheetData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch marksheets');
      }
      
    } catch (error) {
      console.error('Error fetching marksheets:', error);
      toast.error(`Failed to load marksheets: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
  };

  const handleExamTypeChange = (e) => {
    setSelectedExamType(e.target.value);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5000/teacher/assign-marksheet-excel', {
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
      toast.success('Marksheets uploaded and processed successfully!');
      
      // Refresh the marksheet data
      fetchClassMarksheets();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadMarksheetTemplate = () => {
    if (!selectedClass || !selectedDivision) {
      toast.error('Please select class and division first');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to download templates');
      return;
    }

    // Construct the URL for template download
    const queryParams = new URLSearchParams({
      class: selectedClass,
      division: selectedDivision
    });

    // Add exam type if selected
    if (selectedExamType) {
      queryParams.append('examType', selectedExamType);
    }

    // Use fetch with authorization header instead of direct link
    fetch(`http://localhost:5000/teacher/marksheet-template?${queryParams}`, {
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
        // Create a download link for the blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `marksheet-template-${selectedClass}-${selectedDivision}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success('Template downloaded successfully');
      })
      .catch(error => {
        console.error('Error downloading template:', error);
        toast.error('Failed to download template');
      });
  };

  const viewMarksheetDetail = (studentId) => {
    navigate(`/teacher/marksheet/${studentId}`);
  };

  if (loading && !marksheetData.length) {
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <FaBook className="mr-3 text-primary-600" />
          Marksheet Management
        </h1>
        <Link to="/teacher/dashboard" className="text-primary-600 hover:text-primary-700 flex items-center">
          <FaArrowLeft className="mr-1" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Class</option>
                {[...new Set(classes.map(c => c.class))].map(classNum => (
                  <option key={classNum} value={classNum}>{classNum}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <select
                value={selectedDivision}
                onChange={handleDivisionChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Division</option>
                {classes
                  .filter(c => c.class.toString() === selectedClass)
                  .map(c => (
                    <option key={c.division} value={c.division}>{c.division}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select
                value={selectedExamType}
                onChange={handleExamTypeChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Exam Types</option>
                {examTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-b">
          <nav className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'view'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              View Marksheets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'upload'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Marksheets
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'create'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Marksheet
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              {activeTab === 'view' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Marksheets for Class {selectedClass}-{selectedDivision}
                    {selectedExamType && ` (${selectedExamType})`}
                  </h2>

                  {marksheetData.length > 0 ? (
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exam Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {marksheetData.map((item) => {
                            // Filter valid marksheets first
                            const validMarksheets = item.marksheets.filter(marksheet => 
                              marksheet.examType !== item.student.fullName && 
                              ['Unit-I', 'Semester-I', 'Unit-II', 'Semester-II'].includes(marksheet.examType)
                            );
                            
                            return validMarksheets.length > 0 ? (
                              validMarksheets.map((marksheet, idx) => (
                                <tr key={`${item.student._id}-${idx}`}>
                                  {idx === 0 && (
                                    <>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" rowSpan={validMarksheets.length}>
                                        {item.student.roll}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap" rowSpan={validMarksheets.length}>
                                        <div className="text-sm font-medium text-gray-900">{item.student.fullName}</div>
                                      </td>
                                    </>
                                  )}
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {marksheet.examType}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {marksheet.obtainedMarks} / {marksheet.totalMarks}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      parseFloat(marksheet.percentage) >= 90
                                        ? 'bg-green-100 text-green-800'
                                        : parseFloat(marksheet.percentage) >= 75
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : parseFloat(marksheet.percentage) >= 35
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {parseFloat(marksheet.percentage).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button
                                      onClick={() => viewMarksheetDetail(item.student._id)}
                                      className="text-primary-600 hover:text-primary-900"
                                    >
                                       View
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr key={item.student._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.student.roll}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{item.student.fullName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="3">
                                  No marksheets available
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  <button
                                    onClick={() => setActiveTab('create')}
                                    className="text-primary-600 hover:text-primary-900"
                                  >
                                    <FaPlus className="inline mr-1" /> Create
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No marksheets found for this class. Upload or create marksheets using the tabs above.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'upload' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Upload Marksheets from Excel
                  </h2>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                    <div className="flex items-center mb-4">
                      <FaFileExcel className="text-green-600 text-xl mr-2" />
                      <span className="font-medium">Upload Marksheets Excel</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Upload an Excel file containing marksheets for multiple students. The file should have the following columns:
                      Student ID, Exam Type, Subject, Marks, Total Marks, Remarks.
                    </p>

                    <input
                      type="file"
                      id="marksheetFile"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <label
                      htmlFor="marksheetFile"
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
                    >
                      {isUploading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </span>
                      ) : (
                        'Select File'
                      )}
                    </label>

                    <div className="mt-4">
                      <button
                        onClick={downloadMarksheetTemplate}
                        className="text-primary-600 hover:text-primary-700 text-sm inline-flex items-center"
                      >
                        <FaFileExcel className="mr-1" /> Download Marksheet Template
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'create' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Create New Marksheet
                  </h2>

                  <div className="text-center py-12">
                    <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Marksheet Creation</h3>
                    <p className="text-gray-500 mb-6">Create individual marksheets for students.</p>
                    <Link
                      to="/teacher/marksheet/create"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FaPlus className="mr-2" />
                      Create New Marksheet
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksheetPage;
