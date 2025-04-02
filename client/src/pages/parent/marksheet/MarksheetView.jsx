import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MarksheetView = () => {
    const { studentId } = useParams();
    const [marksheets, setMarksheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        fetchMarksheets();
    }, [studentId]);

    const fetchMarksheets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // First fetch student details
            const studentResponse = await fetch(`http://localhost:5000/parent/children`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!studentResponse.ok) throw new Error('Failed to fetch student details');
            const studentsData = await studentResponse.json();
            const currentStudent = studentsData.find(s => s._id === studentId);
            setStudent(currentStudent);

            // Then fetch marksheets
            const marksheetsResponse = await fetch(`http://localhost:5000/parent/student/${studentId}/marksheets`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!marksheetsResponse.ok) {
                const error = await marksheetsResponse.json();
                throw new Error(error.message || 'Failed to fetch marksheets');
            }

            const data = await marksheetsResponse.json();
            if (data.success) {
                setMarksheets(data.marksheets);
            } else {
                throw new Error('Failed to fetch marksheets');
            }
        } catch (error) {
            console.error('Error fetching marksheets:', error);
            toast.error(error.message || 'Failed to load marksheets');
        } finally {
            setLoading(false);
        }
    };

    // Add more features like PDF download, filtering by exam type, etc.

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {student ? `${student.fullName}'s Marksheets` : 'Student Marksheets'}
                </h1>
                <Link to="/parent/dashboard" className="text-primary-600 hover:text-primary-700">
                    <FaArrowLeft className="inline mr-2" />Back to Dashboard
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : marksheets.length > 0 ? (
                <div className="space-y-6">
                    {marksheets.map((marksheet) => (
                        <div key={marksheet._id} className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {marksheet.examType}
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {marksheet.subjects.map((subject, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {subject.subject}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {subject.marks}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {subject.totalMarks}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {((subject.marks / subject.totalMarks) * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {subject.remarks}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {marksheet.obtainedMarks}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {marksheet.totalMarks}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {marksheet.percentage}%
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No marksheets available yet.</p>
                </div>
            )}
        </div>
    );
};

export default MarksheetView;
