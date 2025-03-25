import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaChalkboardTeacher, FaUsers, FaChartLine } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaGraduationCap className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-secondary-900">SchoolTrack</span>
          </div>
          <div>
            <Link 
              to="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Streamline Your Educational Management
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                SchoolTrack connects administrators, teachers, and parents in one comprehensive platform.
              </p>
              <div className="space-x-4">
                <Link 
                  to="/login" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Get Started
                </Link>
                <Link 
                  to="/admin/register" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-500 bg-opacity-30 hover:bg-opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Admin Registration
                </Link>
              </div>
            </div>
            <div className="hidden md:block md:w-1/2">
              {/* Placeholder for a hero image */}
              <div className="w-full h-80 bg-primary-400 bg-opacity-20 rounded-lg flex items-center justify-center">
                <FaGraduationCap className="h-32 w-32 text-white opacity-70" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900">Features for Every Role</h2>
            <p className="mt-4 text-xl text-secondary-500">
              SchoolTrack provides tailored functionality for administrators, teachers, and parents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Admin Features */}
            <div className="bg-secondary-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-lg text-primary-600 mb-4">
                <FaUsers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">For Administrators</h3>
              <ul className="space-y-2 text-secondary-600">
                <li>• Manage teacher & parent accounts</li>
                <li>• Track student records</li>
                <li>• Oversee donation system</li>
                <li>• Efficient search functionality</li>
              </ul>
            </div>

            {/* Teacher Features */}
            <div className="bg-secondary-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-lg text-primary-600 mb-4">
                <FaChalkboardTeacher className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">For Teachers</h3>
              <ul className="space-y-2 text-secondary-600">
                <li>• Assign & manage marksheets</li>
                <li>• Track student attendance</li>
                <li>• Create dynamic forms</li>
                <li>• Communicate with parents</li>
                <li>• Excel data uploads</li>
              </ul>
            </div>

            {/* Parent Features */}
            <div className="bg-secondary-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-lg text-primary-600 mb-4">
                <FaChartLine className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">For Parents</h3>
              <ul className="space-y-2 text-secondary-600">
                <li>• View academic records</li>
                <li>• Track attendance</li>
                <li>• Complete teacher forms</li>
                <li>• Teacher communication</li>
                <li>• Manage donations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <FaGraduationCap className="h-6 w-6" />
                <span className="ml-2 text-lg font-bold">SchoolTrack</span>
              </div>
              <p className="text-secondary-400 text-sm mt-1">
                Educational Management System
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-secondary-400 text-sm">
                © {new Date().getFullYear()} SchoolTrack. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
