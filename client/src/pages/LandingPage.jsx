import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaChalkboardTeacher, FaUsers, FaBook, FaMedal, FaSchool } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="bg-gradient-to-b from-white to-sand min-h-screen">
      {/* Hero Section with full-height background image */}
      <header className="bg-primary-800 text-white relative">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative container mx-auto px-6 py-20 md:py-32 md:flex md:items-center">
          <div className="md:w-1/2 md:pr-8 z-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Welcome to R.I. Vidya Mandir
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Established in 1994, empowering young minds through quality education for over 26 years.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-center transition-all"
              >
                Sign in to Portal
              </Link>
              <a
                href="#about"
                className="border-2 border-white hover:bg-white hover:text-primary-800 text-white font-bold py-3 px-6 rounded-lg text-center transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 z-10">
            <img 
              src="/school-building.jpg" 
              alt="R.I. Vidya Mandir School Building" 
              className="rounded-lg shadow-xl w-full h-auto object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/600x400?text=R.I.+Vidya+Mandir';
              }}
            />
          </div>
        </div>
      </header>

      {/* About Section with improved alignment */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-800 mb-4">About Our School</h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </div>
          
          <div className="md:flex md:items-center md:gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <img 
                src="/students.jpg" 
                alt="Happy students at R.I. Vidya Mandir" 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x400?text=Our+Students';
                }}
              />
            </div>
            <div className="md:w-1/2">
              <p className="text-gray-700 mb-6 leading-relaxed">
                R.I. Vidya Mandir was established in 1994 and is managed privately as an unaided institution. Located in the urban area of Kalyan Dombivli-URC1 block of Thane district, Maharashtra, our school provides education from Class 1 to Class 7.
              </p>
              <p className="text-gray-700 mb-8 leading-relaxed">
                We are a co-educational institution with an attached pre-primary section. English is our medium of instruction, and we take pride in providing quality education in a nurturing environment.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaMedal className="text-primary-600 text-xl" />
                  </div>
                  <span className="ml-4 text-gray-800">Established 1994</span>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaSchool className="text-primary-600 text-xl" />
                  </div>
                  <span className="ml-4 text-gray-800">English Medium</span>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUsers className="text-primary-600 text-xl" />
                  </div>
                  <span className="ml-4 text-gray-800">Co-educational</span>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaChalkboardTeacher className="text-primary-600 text-xl" />
                  </div>
                  <span className="ml-4 text-gray-800">Experienced Faculty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-sand">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Our Facilities</h2>
            <div className="w-20 h-1 bg-primary-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBook className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Library</h3>
              <p className="text-gray-600">
                Our school library houses 300 books for students to explore and expand their knowledge.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSchool className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Infrastructure</h3>
              <p className="text-gray-600">
                6 well-maintained classrooms, proper sanitation facilities, and a playground for physical activities.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserGraduate className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pre-Primary Section</h3>
              <p className="text-gray-600">
                Dedicated pre-primary section with 3 teachers to provide early childhood education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="p-8 md:w-1/2 bg-primary-700 text-white">
                <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <p>
                    <strong>Address:</strong><br />
                    Ward No.102, Kalyan Dombivli-URC1<br />
                    Thane, Maharashtra 421201
                  </p>
                  <p>
                    <strong>UDISE Code:</strong> 27210610202
                  </p>
                  <p>
                    <strong>Email:</strong> contact@rividyamandir.edu.in
                  </p>
                  <p>
                    <strong>Phone:</strong> Please contact school administration
                  </p>
                </div>
              </div>
              <div className="p-8 md:w-1/2">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Our Location</h2>
                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                  {/* Placeholder for map or school image */}
                  <div className="h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <p className="text-center p-4">
                      R.I. Vidya Mandir is located in Ward No.102, Kalyan Dombivli-URC1, Thane District, Maharashtra
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold mb-4">R.I. Vidya Mandir</h3>
              <p className="text-primary-200">Empowering young minds since 1994</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="#about" className="text-primary-200 hover:text-white">About Us</a></li>
                  <li><a href="#" className="text-primary-200 hover:text-white">Academic Programs</a></li>
                  <li><a href="#" className="text-primary-200 hover:text-white">Admissions</a></li>
                  <li><Link to="/login" className="text-primary-200 hover:text-white">Portal Login</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-primary-200 hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="text-primary-200 hover:text-white">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-800 mt-8 pt-8 text-center text-primary-300">
            <p>&copy; {new Date().getFullYear()} R.I. Vidya Mandir. All rights reserved.</p>
            <p className="mt-2 text-xs">Powered by SchoolTrack Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
