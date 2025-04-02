import React from 'react';
import { Outlet } from 'react-router-dom';
import ParentNavbar from '../ui/ParentNavbar';
import Footer from '../ui/Footer';

const ParentLayout = () => {
  return (
    <div className="min-h-screen bg-sand flex flex-col">
      {/* Top Navigation */}
      <ParentNavbar donationsLink="/donations" />
      
      {/* Main Content */}
      <div className="flex-grow p-6 md:p-8 overflow-auto">
        <Outlet />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ParentLayout;