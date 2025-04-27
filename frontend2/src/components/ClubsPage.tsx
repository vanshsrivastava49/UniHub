import React, { useState } from 'react';
import { Users, Star, Search } from 'lucide-react';
import Header from "./Header";
const ClubsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const clubs = [
    {
      id: 1,
      name: "Tech Innovators",
      members: 234,
      description: "A community of tech enthusiasts working on innovative projects",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      category: "Technology"
    },
    {
      id: 2,
      name: "Creative Arts Society",
      members: 189,
      description: "Express yourself through various forms of art and creativity",
      image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80",
      category: "Arts"
    },
    {
      id: 3,
      name: "Debate Club",
      members: 156,
      description: "Enhance your public speaking and critical thinking skills",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      category: "Academic"
    },
    {
      id: 4,
      name: "Environmental Action",
      members: 121,
      description: "Work towards a more sustainable campus and community",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      category: "Community"
    },
    {
      id: 5,
      name: "Photography Society",
      members: 168,
      description: "Capture moments and learn professional photography techniques",
      image: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=800&q=80",
      category: "Arts"
    },
    {
      id: 6,
      name: "Robotics Team",
      members: 105,
      description: "Design, build, and program robots for competitions and exhibitions",
      image: "https://images.unsplash.com/photo-1581092921461-eab70342163e?auto=format&fit=crop&w=800&q=80",
      category: "Technology"
    }
  ];

  const filteredClubs = searchTerm 
    ? clubs.filter(club => 
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clubs;

  return (
    <div>
      <Header/>
          <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white neon-text">Campus Clubs</h2>
          <p className="text-gray-300 mt-2">Find and join student-led organizations that match your interests</p>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clubs..."
                className="bg-black/20 w-full border border-white/20 text-white pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="bg-white/10 text-white px-4 py-2 rounded-full hover:bg-white/20 transition">All Clubs</button>
              <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">Technology</button>
              <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">Arts</button>
              <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">Academic</button>
            </div>
          </div>
        </div>
        
        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div key={club.id} className="bg-black/30 backdrop-blur-md rounded-lg overflow-hidden hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all">
              <img src={club.image} alt={club.name} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-white">{club.name}</h3>
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">{club.category}</span>
                </div>
                <div className="flex items-center text-[#FFD700] mb-3">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{club.members} members</span>
                </div>
                <p className="text-gray-300">{club.description}</p>
                <div className="mt-4 flex space-x-3">
                  <button className="flex-1 bg-transparent border border-[#FFD700] text-[#FFD700] py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all">
                    Join Club
                  </button>
                  <button className="p-2 border border-[#FFD700] text-[#FFD700] rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Create Club CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#1C89E7]/30 to-[#D53A74]/30 p-6 rounded-lg backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Don't see a club you like?</h3>
              <p className="text-gray-300">Start your own club and build a community around your interests.</p>
            </div>
            <button className="mt-4 md:mt-0 bg-white text-purple-700 px-6 py-2 rounded-full font-medium hover:bg-purple-100 transition">
              Create a Club
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ClubsPage;