import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaExclamationTriangle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const StudentMarksheet = () => {
  const { studentId } = useParams();
  const [marksheets, setMarksheets] = useState([]);
  const [student, setStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedMarksheet, setEditedMarksheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState('parent'); // Default to parent, can be 'teacher'
  const [allClassSubjects, setAllClassSubjects] = useState([]);

  useEffect(() => {
    const checkUserRole = () => {
      const role = localStorage.getItem('role');
      if (role === 'teacher') {
        setUserRole('teacher');
      }
    };

    checkUserRole();
    fetchStudentData();
  }, [studentId]);

  useEffect(() => {
    if (studentId && selectedExam) {
      fetchMarksheetData();
    }
  }, [studentId, selectedExam]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const studentResponse = await fetch(`http://192.168.35.107:5000/parent/children`, {
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
      
      // Fetch all subjects for this class - we'll get this from the teacher profile
      const subjectsResponse = await fetch('http://192.168.35.107:5000/parent/class-subjects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          class: currentStudent.class,
          division: currentStudent.division
        })
      });
      
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        if (subjectsData.subjects && Array.isArray(subjectsData.subjects)) {
          setAllClassSubjects(subjectsData.subjects);
        }
      }

      const marksheetResponse = await fetch(`http://192.168.35.107:5000/parent/marksheet/exams/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!marksheetResponse.ok) {
        let errorMessage;
        try {
          const errorData = await marksheetResponse.json();
          errorMessage = errorData.error || `Server responded with ${marksheetResponse.status}`;
        } catch (e) {
          errorMessage = `Server responded with ${marksheetResponse.status}. Response is not valid JSON.`;
        }
        throw new Error(errorMessage);
      }

      const examTypes = await marksheetResponse.json();

      if (examTypes && examTypes.length > 0) {
        setSelectedExam(examTypes[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError(error.message);
      toast.error('Failed to load student data');
      setLoading(false);
    }
  };

  const fetchMarksheetData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://192.168.35.107:5000/parent/marksheet/${studentId}/${selectedExam}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || `Server responded with ${response.status}`;
        throw new Error(errorMessage);
      }

      if (!Array.isArray(data) || data.length === 0) {
        setMarksheets([]);
        setLoading(false);
        return;
      }

      setMarksheets(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching marksheet:', error);
      setError(error.message);
      toast.error('Failed to load marksheet data');
      setLoading(false);
    }
  };

  const handleExamChange = (e) => {
    setSelectedExam(e.target.value);
  };

  const calculateTotal = (subjects) => {
    return subjects.reduce((total, subject) => total + subject.marks, 0);
  };

  const calculatePercentage = (subjects) => {
    // Only include subjects that have marks entered
    const subjectsWithMarks = subjects.filter(subject => subject.marks !== undefined && subject.marks !== null);
    
    // If no subjects have marks entered, return 0
    if (subjectsWithMarks.length === 0) return "0.00";
    
    const totalMarks = subjectsWithMarks.reduce((total, subject) => total + subject.marks, 0);
    const totalPossible = subjectsWithMarks.reduce((total, subject) => total + subject.totalMarks, 0);
    
    // Avoid division by zero
    if (totalPossible === 0) return "0.00";
    return ((totalMarks / totalPossible) * 100).toFixed(2);
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'O';
    if (percentage >= 85) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const areAllSubjectsGraded = (subjects, allSubjects) => {
    // If we don't have the full list of class subjects, we can't determine if all are graded
    if (!allSubjects.length) return true;
    
    // Create a map of graded subjects
    const gradedSubjectsMap = {};
    subjects.forEach(subject => {
      if (subject.marks !== undefined && subject.marks !== null) {
        gradedSubjectsMap[subject.subject] = true;
      }
    });
    
    // Check if all subjects from the class list are graded
    return allSubjects.every(subject => {
      const subjectName = typeof subject === 'string' ? subject : subject.subject;
      return gradedSubjectsMap[subjectName];
    });
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditMode(false);
      setEditedMarksheet(null);
    } else {
      if (marksheets && marksheets.length > 0) {
        const marksheetCopy = JSON.parse(JSON.stringify(marksheets[0]));
        setEditedMarksheet(marksheetCopy);
        setEditMode(true);
      }
    }
  };

  const handleSubjectMarkChange = (subjectIndex, field, value) => {
    if (!editedMarksheet) return;

    const updatedMarksheet = { ...editedMarksheet };
    const updatedSubjects = [...updatedMarksheet.subjects];
    const updatedSubject = { ...updatedSubjects[subjectIndex] };

    if (field === 'marks' || field === 'totalMarks') {
      const numValue = parseInt(value, 10) || 0;
      updatedSubject[field] = Math.max(0, numValue);
    } else {
      updatedSubject[field] = value;
    }

    updatedSubjects[subjectIndex] = updatedSubject;
    updatedMarksheet.subjects = updatedSubjects;

    setEditedMarksheet(updatedMarksheet);
  };

  const handleSaveChanges = async () => {
    if (!editedMarksheet) return;

    for (const subject of editedMarksheet.subjects) {
      if (subject.marks > subject.totalMarks) {
        toast.error(`${subject.subject}: Marks cannot exceed total marks`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const totalObtained = editedMarksheet.subjects.reduce((sum, subj) => sum + subj.marks, 0);
      const totalPossible = editedMarksheet.subjects.reduce((sum, subj) => sum + subj.totalMarks, 0);
      const percentage = (totalObtained / totalPossible) * 100;

      const updatedMarksheet = {
        ...editedMarksheet,
        obtainedMarks: totalObtained,
        totalMarks: totalPossible,
        percentage: percentage.toFixed(2)
      };

      const response = await fetch(`http://192.168.35.107:5000/teacher/marksheet/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedMarksheet)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update marksheet');
      }

      toast.success('Marksheet updated successfully');
      setMarksheets([updatedMarksheet]);
      setEditMode(false);
      setEditedMarksheet(null);
    } catch (error) {
      console.error('Error updating marksheet:', error);
      toast.error(error.message || 'Failed to update marksheet');
    } finally {
      setSaving(false);
    }
  };

  // Add a function to determine the default max marks based on exam type
  const getDefaultMaxMarksForExam = (examType) => {
    if (examType === 'Unit-I' || examType === 'Unit-II') {
      return 20; // Unit tests are of 20 marks
    }
    return 100; // Default max marks for other exams
  };

  const renderTableContent = () => {
    const dataSource = editMode ? editedMarksheet : marksheets[0];
    // Create a map of available subjects with their data
    const subjectMap = {};
    if (dataSource && dataSource.subjects) {
      dataSource.subjects.forEach(subject => {
        subjectMap[subject.subject] = subject;
      });
    }
    
    // Display all subjects for the class, with "Marks Not Entered" for missing subjects
    const subjectsToDisplay = allClassSubjects.length > 0 ? 
      allClassSubjects : 
      (dataSource?.subjects?.map(s => s.subject) || []);

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subjectsToDisplay.map((subject, index) => {
            // If subject is a string (from allClassSubjects), use it, otherwise get subject name from object
            const subjectName = typeof subject === 'string' ? subject : subject.subject;
            const subjectData = subjectMap[subjectName];
            
            return (
              <tr key={subjectName}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subjectName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editMode && subjectData ? (
                    <input
                      type="number"
                      min="0"
                      value={subjectData.marks}
                      onChange={(e) => {
                        const subjectIndex = dataSource.subjects.findIndex(s => s.subject === subjectName);
                        if (subjectIndex !== -1) {
                          handleSubjectMarkChange(subjectIndex, 'marks', e.target.value);
                        }
                      }}
                      className="w-20 p-1 border border-gray-300 rounded"
                    />
                  ) : subjectData ? (
                    subjectData.marks
                  ) : (
                    <span className="text-yellow-600 italic">Marks Not Entered</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editMode && subjectData ? (
                    <input
                      type="number"
                      min="0"
                      value={subjectData.totalMarks}
                      onChange={(e) => {
                        const subjectIndex = dataSource.subjects.findIndex(s => s.subject === subjectName);
                        if (subjectIndex !== -1) {
                          handleSubjectMarkChange(subjectIndex, 'totalMarks', e.target.value);
                        }
                      }}
                      className="w-20 p-1 border border-gray-300 rounded"
                    />
                  ) : subjectData ? (
                    subjectData.totalMarks
                  ) : (
                    <span className="text-gray-400">{selectedExam && getDefaultMaxMarksForExam(selectedExam)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editMode && subjectData ? (
                    <input
                      type="text"
                      value={subjectData.teacherRemarks || ''}
                      onChange={(e) => {
                        const subjectIndex = dataSource.subjects.findIndex(s => s.subject === subjectName);
                        if (subjectIndex !== -1) {
                          handleSubjectMarkChange(subjectIndex, 'teacherRemarks', e.target.value);
                        }
                      }}
                      className="w-full p-1 border border-gray-300 rounded"
                      placeholder="Add remarks..."
                    />
                  ) : subjectData && subjectData.teacherRemarks ? (
                    subjectData.teacherRemarks
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
              {dataSource?.subjects ? 
                (editMode
                  ? editedMarksheet.subjects.reduce((total, subject) => total + subject.marks, 0)
                  : calculateTotal(dataSource.subjects))
                : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
              {dataSource?.subjects ?
                (editMode
                  ? editedMarksheet.subjects.reduce((total, subject) => total + subject.totalMarks, 0)
                  : dataSource.subjects.reduce((total, subject) => total + subject.totalMarks, 0))
                : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap"></td>
          </tr>
        </tfoot>
      </table>
    );
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
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <div className="flex">
          <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <p className="font-medium">Error loading marksheet</p>
            <p className="text-sm">{error}</p>
            <Link
              to="/parent/dashboard"
              className="text-red-700 hover:text-red-900 underline mt-2 inline-block"
            >
              <FaArrowLeft className="inline mr-2" />
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
        <p>Student information not found. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">
          {student.fullName}'s Marksheet
        </h1>

        <Link
          to={userRole === 'teacher' ? "/teacher/dashboard" : "/parent/dashboard"}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Student Details</h2>
            <p className="text-gray-600">Class {student.class}-{student.division} | Roll No: {student.roll}</p>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedExam}
              onChange={handleExamChange}
              className="border rounded-md px-3 py-2"
              disabled={editMode}
            >
              <option value="">Select Exam</option>
              {['Unit-I', 'Semester-I', 'Unit-II', 'Semester-II'].map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>

            {userRole === 'teacher' && marksheets && marksheets.length > 0 && (
              <>
                {editMode ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      {saving ? 'Saving...' : <><FaSave className="mr-1" /> Save</>}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                      <FaTimes className="mr-1" /> Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    <FaEdit className="mr-1" /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {selectedExam ? (
          <div>
            <div className="overflow-x-auto">
              {renderTableContent()}
            </div>

            {marksheets && marksheets.length > 0 && (
              <div className="mt-8">
                {areAllSubjectsGraded(marksheets[0].subjects, allClassSubjects) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-2">Percentage</h3>
                      <p className="text-3xl font-bold text-blue-700">
                        {editMode
                          ? ((editedMarksheet.subjects.filter(s => s.marks).reduce((sum, subj) => sum + subj.marks, 0) /
                              editedMarksheet.subjects.filter(s => s.marks).reduce((sum, subj) => sum + subj.totalMarks, 0)) * 100).toFixed(2)
                          : calculatePercentage(marksheets[0].subjects)}%
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-800 mb-2">Grade</h3>
                      <p className="text-3xl font-bold text-green-700">
                        {editMode
                          ? getGrade(((editedMarksheet.subjects.filter(s => s.marks).reduce((sum, subj) => sum + subj.marks, 0) /
                                    editedMarksheet.subjects.filter(s => s.marks).reduce((sum, subj) => sum + subj.totalMarks, 0)) * 100))
                          : getGrade(calculatePercentage(marksheets[0].subjects))}
                      </p>
                    </div>
                  </div>
                ) : userRole === 'teacher' ? (
                  // Only teachers can see the incomplete status message
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                    <h3 className="font-semibold text-yellow-800 mb-2 text-center">Results Not Finalized</h3>
                    <p className="text-center text-yellow-700">
                      The results cannot be displayed to parents as marks have not been entered for all subjects.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                    <h3 className="font-semibold text-yellow-800 mb-2 text-center">Results Not Declared</h3>
                    <p className="text-center text-yellow-700">
                      The results have not been declared yet as marks have not been entered for all subjects.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="bg-gray-100 inline-block p-4 rounded-full mb-4">
              <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No Exam Selected</h3>
            <p className="text-gray-600">
              Please select an exam type to view the marksheet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMarksheet;
