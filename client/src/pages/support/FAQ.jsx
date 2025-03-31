import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});
  
  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const faqItems = [
    {
      id: 1,
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. You will receive an email with instructions to reset your password."
    },
    {
      id: 2,
      question: "How can I view my child's attendance?",
      answer: "After logging in to the parent portal, go to your dashboard and select your child. Then click on the 'Attendance' link to view their attendance records."
    },
    {
      id: 3,
      question: "How do I submit a form assigned by the teacher?",
      answer: "Forms assigned by teachers can be found in the 'Forms' section of your parent portal. Click on the pending form, fill in the required information, and submit it."
    },
    {
      id: 4,
      question: "Can I communicate with my child's teachers through the portal?",
      answer: "Yes, you can communicate with teachers through the 'Chat' section. Select your child and then choose the teacher you wish to contact."
    },
    {
      id: 5,
      question: "How do I view my child's marksheet?",
      answer: "Marksheets can be accessed from your dashboard by selecting your child and clicking on the 'Marksheet' button."
    },
    {
      id: 6,
      question: "What should I do if I find an error in my child's information?",
      answer: "If you notice any discrepancies in your child's information, please raise a complaint through the support section and provide details of the error."
    },
    {
      id: 7,
      question: "How do I make a donation through the portal?",
      answer: "Parents can make donations by navigating to the 'Donations' section and following the instructions to create a new donation."
    }
  ];
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary-800 mb-6">Frequently Asked Questions</h1>
      
      <div className="space-y-4">
        {faqItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="flex justify-between items-center w-full p-4 text-left bg-white hover:bg-gray-50"
              onClick={() => toggleItem(item.id)}
            >
              <span className="font-medium text-gray-900">{item.question}</span>
              {openItems[item.id] ? (
                <FaChevronUp className="text-primary-500" />
              ) : (
                <FaChevronDown className="text-gray-400" />
              )}
            </button>
            
            {openItems[item.id] && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
