import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBook, FaUser, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MarksheetDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [marksheets, setMarksheets] = useState([]);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);

  useEffect(() => {
    fetchStudentMarksheets();
  }, [studentId]);

  const fetchStudentMarksheets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // First get student details - Using a proper URL structure
      // The request was failing because class and division params were empty strings
      // Change to use just the studentId parameter
      const studentResponse = await fetch(`http://192.168.35.107:5000/teacher/class-students?class=&division=&studentId=${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!studentResponse.ok) {
        throw new Error(`Failed to fetch student: ${studentResponse.status}`);
      }

      const studentData = await studentResponse.json();
      if (!studentData || !Array.isArray(studentData) || studentData.length === 0) {
        throw new Error('Student not found');
      }
      
      setStudent(studentData[0]);

      // Then get marksheets
      const marksheetResponse = await fetch(`http://192.168.35.107:5000/teacher/marksheets?studentId=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!marksheetResponse.ok) {
        throw new Error(`Failed to fetch marksheets: ${marksheetResponse.status}`);
      }

      const marksheetData = await marksheetResponse.json();
      setMarksheets(marksheetData.marksheets || []);
      
      if (marksheetData.marksheets && marksheetData.marksheets.length > 0) {
        setSelectedMarksheet(marksheetData.marksheets[0]);
      }

    } catch (error) {
      console.error('Error fetching student marksheets:', error);
      setError(error.message);
      toast.error(`Failed to load marksheet data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksheetChange = (e) => {
    const marksheetId = e.target.value;
    const selected = marksheets.find(ms => ms._id === marksheetId);
    setSelectedMarksheet(selected || null);
  };

  const handlePrint = () => {
    window.print();
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
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center">
          <FaBook className="mr-3 text-primary-600" />
          Student Marksheet
        </h1>
        <div className="flex space-x-4">
          <button 
            onClick={handlePrint}
            className="text-primary-600 hover:text-primary-700 flex items-center"
          >
            <FaPrint className="mr-1" /> Print
          </button>
          <Link to="/teacher/marksheets" className="text-primary-600 hover:text-primary-700 flex items-center">
            <FaArrowLeft className="mr-1" /> Back to Marksheets
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
        {student && (
          <div className="p-6 bg-gray-50 border-b print:bg-white">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FaUser className="text-primary-600 text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">{student.fullName}</h2>
                <p className="text-gray-600">Class {student.class}-{student.division} | Roll: {student.roll}</p>
              </div>
            </div>
            
            {marksheets.length > 0 && (
              <div className="flex items-center print:hidden">
                <label className="block text-sm font-medium text-gray-700 mr-4">
                  Select Exam:
                </label>
                <select
                  value={selectedMarksheet?._id || ''}
                  onChange={handleMarksheetChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {marksheets.map(ms => (
                    <option key={ms._id} value={ms._id}>{ms.examType}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {selectedMarksheet ? (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">{selectedMarksheet.examType} Examination</h2>
                <p className="text-gray-600">Academic Year 2024-2025</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks Obtained
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Marks
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedMarksheet.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {subject.marks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {subject.totalMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (subject.marks / subject.totalMarks * 100) >= 90
                              ? 'bg-green-100 text-green-800'
                              : (subject.marks / subject.totalMarks * 100) >= 75
                              ? 'bg-yellow-100 text-yellow-800'
                              : (subject.marks / subject.totalMarks * 100) >= 35
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {((subject.marks / subject.totalMarks) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subject.teacherRemarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                        {selectedMarksheet.obtainedMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                        {selectedMarksheet.totalMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          parseFloat(selectedMarksheet.percentage) >= 90
                            ? 'bg-green-100 text-green-800'
                            : parseFloat(selectedMarksheet.percentage) >= 75
                            ? 'bg-yellow-100 text-yellow-800'
                            : parseFloat(selectedMarksheet.percentage) >= 35
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {parseFloat(selectedMarksheet.percentage).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {selectedMarksheet.overallRemarks || '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-8 border-t pt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <p>Issued Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="mb-10 print:mb-0">&nbsp;</p>
                  <div className="border-t border-gray-300 w-40 ml-auto print:border-black"></div>
                  <p className="mt-1 text-sm">School Authority Signature</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-6">There are no marksheets available for this student yet.</p>
              <Link 
                to="/teacher/marksheet/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create Marksheet
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksheetDetail;
