import React, { useState } from 'react';
import SearchWindow from './SearchWindow';

const SearchPage: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [regNo, setRegNo] = useState('');

  const handleViewProfile = () => {
    if (regNo.trim() !== '') {
      setShowProfile(true);
    } else {
      alert('Please enter a registration number.');
    }
  };
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto pt-20 text-center">
        <h1 className="text-4xl font-bold neon-text mb-6">Welcome to UniHub</h1>
        <p className="text-gray-400 mb-6">Search and view student profiles across the campus.</p>
        
        <input
          type="text"
          placeholder="Enter Registration Number"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          className="px-4 py-2 mb-4 rounded-full text-black w-72 outline-none focus:ring-2 focus:ring-[#FFD700]"
        />
        <br />
        <button
          onClick={handleViewProfile}
          className="bg-[#FFD700] text-black font-semibold px-6 py-3 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all"
        >
          View Student Profile
        </button>
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50">
          <SearchWindow regNo={regNo} onClose={() => setShowProfile(false)} />
        </div>
      )}
    </div>
  );
};

export default SearchPage;
