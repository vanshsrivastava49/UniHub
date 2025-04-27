// src/EventsPage.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import Header from "./Header";
const EventsPage: React.FC = () => {
  const events = [
    {
      id: 1,
      title: "Tech Fest 2025",
      date: "March 15, 2025",
      description: "Annual technology festival featuring coding competitions, robotics workshops, and tech talks.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Cultural Night",
      date: "April 5, 2025",
      description: "A celebration of diverse cultures through music, dance, and traditional performances.",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Sports Meet",
      date: "May 10, 2025",
      description: "Inter-college sports competition featuring various athletic events and team sports.",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "Career Fair",
      date: "June 2, 2025",
      description: "Connect with potential employers and explore job opportunities after graduation.",
      image: "https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 5,
      title: "Science Symposium",
      date: "June 15, 2025",
      description: "A gathering of scientific minds to discuss breakthroughs and research in various fields.",
      image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 6,
      title: "Alumni Meetup",
      date: "July 8, 2025",
      description: "Network with graduates and learn from their experiences in the professional world.",
      image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div><Header/>
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white neon-text">Campus Events</h2>
          <p className="text-gray-300 mt-2">Discover and register for exciting events happening on campus this semester</p>
        </div>
        
        {/* Event Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button className="bg-white/10 text-white px-4 py-2 rounded-full hover:bg-white/20 transition">All Events</button>
          <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">This Month</button>
          <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">Academic</button>
          <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">Cultural</button>
          <button className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/10 transition">Sports</button>
        </div>
        
        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-black/30 backdrop-blur-md rounded-lg overflow-hidden hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all">
              <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                <div className="flex items-center text-[#FFD700] mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{event.date}</span>
                </div>
                <p className="text-gray-300">{event.description}</p>
                <button className="mt-4 w-full bg-transparent border border-[#FFD700] text-[#FFD700] py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all">
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex justify-center mt-10">
          <div className="flex space-x-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-white hover:bg-white/10 transition">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent text-white hover:bg-white/10 transition">3</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default EventsPage;