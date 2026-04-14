import React from 'react';
import { User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="text-green-400 text-xl font-bold">
          OnlineTravelGuide
        </div>
        
        {/* Navigation Menu */}
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-white hover:text-green-400 transition-colors duration-200">
            Home
          </a>
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
            Accommodations
          </a>
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
            Gallery
          </a>
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
            Feedback
          </a>
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
            Agent Registration
          </a>
          <a href="#" className="text-gray-300 hover:text-green-400 transition-colors duration-200">
            Admin
          </a>
        </nav>
        
        {/* Login/Register Button */}
        <button className="bg-transparent border border-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 hover:border-green-400 transition-all duration-200 flex items-center space-x-2">
          <User size={18} />
          <span>Login/Register</span>
        </button>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;