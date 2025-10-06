import React from 'react';

const Footer: React.FC = () => (
  <footer className="w-full bg-white shadow-inner py-4 px-6 text-center text-gray-500 text-sm mt-auto">
    &copy; {new Date().getFullYear()} PromptOps. All rights reserved.
  </footer>
);

export default Footer;
