import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaChartBar, FaEdit, FaDownload, FaFileCsv, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FormView = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormDetails();
  }, [id]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch form details
      const formResponse = await fetch(`http://localhost:5000/teacher/form/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!formResponse.ok) {
        throw new Error('Failed to fetch form details');
      }
      
      const formData = await formResponse.json();
      
      if (!formData.success) {
        throw new Error(formData.message || 'Failed to fetch form details');
      }
      
      setForm(formData.form);
      
      // Fetch form responses
      const responsesResponse = await fetch(`http://localhost:5000/teacher/get-form-responses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!responsesResponse.ok) {
        throw new Error('Failed to fetch form responses');
      }
      
      const responsesData = await responsesResponse.json();
      setResponses(responsesData || []);
      
    } catch (error) {
      console.error('Error fetching form details:', error);
      toast.error(error.message || 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!form || !responses || responses.length === 0) {
      toast.error('No responses to export');
      return;
    }
    
    try {
      // Generate headers
      const headers = ['Parent', 'Student', 'Timestamp'];
      const fieldLabels = form.fields.map(field => field.label);
      headers.push(...fieldLabels);
      
      // Generate rows
      const rows = responses.map(response => {
        const basicInfo = [
          response.parentName || 'Unknown',
          response.studentName || 'Unknown',
          new Date(response.createdAt).toLocaleString()
        ];
        
        // Add field values
        const fieldValues = fieldLabels.map(label => {
          const answer = response.answers.find(a => a.field === label);
          return answer ? answer.value : '';
        });
        
        return [...basicInfo, ...fieldValues];
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `form-responses-${form.title.replace(/\s+/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export responses');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-3xl" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <p>Form not found or you don't have permission to view it.</p>
          <Link to="/teacher/forms" className="mt-2 text-red-600 hover:text-red-800">
            <FaArrowLeft className="inline mr-2" />
            Back to Forms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{form.title}</h1>
        <div className="flex space-x-3">
          <Link 
            to={`/teacher/forms/analytics/${id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <FaChartBar className="mr-2" /> View Analytics
          </Link>
          <Link 
            to={`/teacher/forms/edit/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaEdit className="mr-2" /> Edit Form
          </Link>
          <Link 
            to="/teacher/forms"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="mr-2" /> Back to Forms
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Form Details</h2>
          <p className="text-gray-600">{form.description}</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Assignment Type:</span>
              <p className="text-gray-800">
                {form.assignedTo === 'class' 
                  ? `Entire Class (${form.class.standard}-${form.class.division})` 
                  : 'Specific Students'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created On:</span>
              <p className="text-gray-800">
                {new Date(form.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Form Questions</h2>
            <span className="text-sm text-gray-500">{form.fields.length} question(s)</span>
          </div>
          
          <div className="space-y-4">
            {form.fields.map((field, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                  </span>
                </div>
                
                {['select', 'radio', 'checkbox'].includes(field.type) && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Options:</span>
                    <ul className="mt-1 pl-5 list-disc text-sm text-gray-600">
                      {field.options.map((option, i) => (
                        <li key={i}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Form Responses</h2>
          <button
            onClick={exportToCsv}
            disabled={responses.length === 0}
            className={`px-4 py-2 rounded-md flex items-center ${
              responses.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FaFileCsv className="mr-2" /> Export to CSV
          </button>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">No responses yet.</p>
            <p className="text-gray-400 mt-2">Responses will appear here once parents submit the form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((response, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.parentName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.studentName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        className="text-primary-600 hover:text-primary-700"
                        onClick={() => {
                          // Logic to view detailed responses
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormView;
