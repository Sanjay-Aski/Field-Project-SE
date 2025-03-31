import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaQuestionCircle, FaCommentAlt, FaExclamationCircle, 
  FaBook, FaUserGraduate, FaChalkboardTeacher, FaUserTie 
} from 'react-icons/fa';

const HelpCenter = () => {
  const helpCategories = [
    {
      id: 'general',
      title: 'General Help',
      icon: <FaQuestionCircle className="text-primary-500 text-xl" />,
      description: 'Common questions and basic portal navigation assistance',
      links: [
        { text: 'Frequently Asked Questions', url: '/support/faq' },
        { text: 'Raise a Complaint', url: '/support/complaint' },
        { text: 'Give Feedback', url: '/support/feedback' }
      ]
    },
    {
      id: 'parent',
      title: 'For Parents',
      icon: <FaUserTie className="text-purple-500 text-xl" />,
      description: 'Help with parent-specific features',
      links: [
        { text: 'Viewing Attendance Records', url: '/support/parent/attendance' },
        { text: 'Accessing Marksheets', url: '/support/parent/marksheets' },
        { text: 'Communicating with Teachers', url: '/support/parent/communication' }
      ]
    },
    {
      id: 'teacher',
      title: 'For Teachers',
      icon: <FaChalkboardTeacher className="text-green-500 text-xl" />,
      description: 'Resources for teachers using the portal',
      links: [
        { text: 'Managing Student Records', url: '/support/teacher/records' },
        { text: 'Creating Forms', url: '/support/teacher/forms' },
        { text: 'Setting Working Days', url: '/support/teacher/attendance' }
      ]
    },
    {
      id: 'admin',
      title: 'For Administrators',
      icon: <FaUserGraduate className="text-red-500 text-xl" />,
      description: 'Administrative functions and management',
      links: [
        { text: 'User Management', url: '/support/admin/users' },
        { text: 'System Configuration', url: '/support/admin/config' },
        { text: 'Data Backup & Recovery', url: '/support/admin/backup' }
      ]
    }
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-secondary-800 mb-2">Welcome to the Help Center</h1>
        <p className="text-gray-600">
          Find answers to common questions and learn how to make the most of the school portal.
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Link 
          to="/support/faq" 
          className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          <FaQuestionCircle className="text-blue-500 text-3xl mb-2" />
          <span className="font-medium text-blue-700">Browse FAQs</span>
        </Link>
        
        <Link 
          to="/support/complaint" 
          className="flex flex-col items-center p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
        >
          <FaExclamationCircle className="text-red-500 text-3xl mb-2" />
          <span className="font-medium text-red-700">Report an Issue</span>
        </Link>
        
        <Link 
          to="/support/feedback" 
          className="flex flex-col items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
        >
          <FaCommentAlt className="text-green-500 text-3xl mb-2" />
          <span className="font-medium text-green-700">Give Feedback</span>
        </Link>
      </div>
      
      {/* Help Categories */}
      <div className="space-y-8">
        {helpCategories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              {category.icon}
              <h2 className="text-xl font-bold ml-2">{category.title}</h2>
            </div>
            
            <p className="text-gray-600 mb-4">{category.description}</p>
            
            <ul className="space-y-2">
              {category.links.map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.url} 
                    className="text-primary-600 hover:text-primary-800 flex items-center"
                  >
                    <FaBook className="mr-2 text-sm" />
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Contact Information */}
      <div className="mt-12 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Still Need Help?</h2>
        <p className="mb-4">If you couldn't find what you're looking for, please contact our support team:</p>
        <ul className="text-gray-700">
          <li>Email: support@rividyamandir.edu.in</li>
          <li>Phone: +91 1234567890 (Mon-Fri, 9 AM - 5 PM)</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpCenter;
