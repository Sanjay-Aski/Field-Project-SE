import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary-600 text-white py-6">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-bold mb-4">R.I. Vidya Mandir</h3>
            <p className="text-neutral-600">Empowering young minds since 1994</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/#about" className="text-neutral-600 hover:text-white">About Us</Link></li>
                <li><Link to="/#facilities" className="text-neutral-600 hover:text-white">Facilities</Link></li>
                <li><Link to="/#contact" className="text-neutral-600 hover:text-white">Contact</Link></li>
                <li><Link to="/login" className="text-neutral-600 hover:text-white">Portal Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/support" className="text-neutral-600 hover:text-white">Help Center</Link></li>
                <li><Link to="/support/faq" className="text-neutral-600 hover:text-white">FAQs</Link></li>
                <li><Link to="/support/complaint" className="text-neutral-600 hover:text-white">Raise a Complaint</Link></li>
                <li><Link to="/support/feedback" className="text-neutral-600 hover:text-white">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-neutral-600 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-neutral-600 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-800 mt-8 pt-6 text-center text-neutral-600">
          <p>&copy; {currentYear} R.I. Vidya Mandir. All rights reserved.</p>
          <p className="mt-2 text-xs">Powered by SchoolTrack Management System</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
