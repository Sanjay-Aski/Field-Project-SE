import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaSpinner, FaChartPie, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FormAnalytics = () => {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/teacher/forms/analytics/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load analytics data');
      }
      
      setAnalytics(data);
      
    } catch (error) {
      console.error('Error fetching form analytics:', error);
      toast.error(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-3xl" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <p>Analytics data not found or you don't have permission to view it.</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Form Analytics: {analytics.formTitle}</h1>
        <div className="flex space-x-3">
          <Link 
            to={`/teacher/forms/view/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaEye className="mr-2" /> View Form
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
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <div className="flex items-center mb-2">
              <FaUsers className="text-blue-500 mr-2" />
              <h3 className="font-medium text-blue-800">Response Rate</h3>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-600">{analytics.overallStats.responseRate}%</p>
              <p className="text-sm text-blue-800">
                {analytics.overallStats.responseCount} of {analytics.overallStats.totalAssigned}
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md border border-green-100">
            <div className="flex items-center mb-2">
              <FaChartPie className="text-green-500 mr-2" />
              <h3 className="font-medium text-green-800">Completion</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {analytics.overallStats.responseCount}
            </p>
            <p className="text-sm text-green-800">Completed responses</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
            <div className="flex items-center mb-2">
              <FaCalendarAlt className="text-purple-500 mr-2" />
              <h3 className="font-medium text-purple-800">Last Response</h3>
            </div>
            <p className="text-lg font-semibold text-purple-600">
              {analytics.overallStats.lastResponse ? 
                new Date(analytics.overallStats.lastResponse).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 
                'No responses yet'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Question Analysis</h2>
        
        {analytics.fieldStats.map((field, index) => (
          <div key={index} className="mb-8 pb-8 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-800">
                {field.label}
                <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {field.type}
                </span>
              </h3>
              <p className="text-sm text-gray-500">
                {field.totalResponses} response{field.totalResponses !== 1 ? 's' : ''}
              </p>
            </div>
            
            {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && field.optionStats ? (
              <div>
                {field.optionStats.map((option, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{option.option}</span>
                      <span className="text-sm text-gray-500">{option.count} ({option.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : field.type === 'text' || field.type === 'email' ? (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Text Responses:</h4>
                {field.responses && field.responses.length > 0 ? (
                  <ul className="space-y-2">
                    {field.responses.map((response, i) => (
                      <li key={i} className="p-2 bg-gray-50 rounded text-sm">
                        {response.value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No text responses recorded</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No detailed analysis available for this question type</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormAnalytics;
