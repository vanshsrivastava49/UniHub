// src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bell,
  Search,
  User,
  Calendar,
  Users,
  FileText,
} from 'lucide-react';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.startsWith('RA') && trimmed.length <= 15) {
      navigate(`/search/${trimmed}`);
    } else {
      alert('Enter a valid RA number (starting with RA and 14 characters total)');
    }
  };

  return (
    <header className="bg-black/20 backdrop-blur-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-white mr-8 neon-text">
              UniHub
            </Link>
            <nav className="hidden md:flex space-x-8">
              <NavLink icon={<Calendar className="w-5 h-5" />} text="Events" to="/events" />
              <NavLink icon={<Users className="w-5 h-5" />} text="Community" to="/community" />
              <NavLink icon={<MessageSquare className="w-5 h-5" />} text="Messages" to="/chats" />
              <NavLink icon={<FileText className="w-5 h-5" />} text="Posts" to="/posts" />
              <NavLink icon={<User className="w-5 h-5" />} text="Profile" to="/dashboard" />
            </nav>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search by RA number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 text-white placeholder-gray-300 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FFD700] w-56"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Search className="w-5 h-5 text-gray-300 cursor-pointer" />
              </button>
            </form>

            <button className="relative p-2 text-gray-200 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#FFD700] rounded-full"></span>
            </button>

            <Link
              to="/register"
              className="bg-[#FFD700] text-black font-semibold px-6 py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all transform hover:scale-105"
            >
              Join UniHub
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink = ({ icon, text, to }: { icon: React.ReactNode; text: string; to: string }) => (
  <Link
    to={to}
    className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors group"
  >
    {icon}
    <span className="group-hover:text-[#FFD700]">{text}</span>
  </Link>
);

export default Header;
