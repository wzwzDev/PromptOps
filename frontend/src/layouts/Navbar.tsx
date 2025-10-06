import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => (
  <nav className="w-full bg-white shadow-md py-3 px-6 flex justify-between items-center fixed top-0 left-0 z-50">
    <div className="font-bold text-teal-700 text-xl">PromptOps</div>
    <div className="flex gap-6">
      <Link to="/" className="text-gray-700 hover:text-teal-600 font-medium">Home</Link>
      <Link to="/career" className="text-gray-700 hover:text-teal-600 font-medium">Career Tools</Link>
      <Link to="/profile" className="text-gray-700 hover:text-teal-600 font-medium">Profile Upload</Link>
  <Link to="/prompt-tools" className="text-gray-700 hover:text-teal-600 font-medium">Prompt Tools</Link>
    </div>
  </nav>
);

export default Navbar;
