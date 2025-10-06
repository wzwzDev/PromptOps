import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-teal-100">
    <Navbar />
    <main className="flex-1 pt-20 pb-8 px-4 sm:px-8 md:px-16 max-w-7xl mx-auto w-full">
      {children}
    </main>
    <Footer />
  </div>
);

export default MainLayout;
