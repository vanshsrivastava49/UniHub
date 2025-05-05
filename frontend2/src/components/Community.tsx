import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';

interface Community {
  community_id: number;
  community_name: string;
  member_count: number;
}

const CommunityPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<number[]>([]);

  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/communities');
        setCommunities(res.data);
      } catch (err) {
        console.error('Error fetching communities', err);
      }
    };

    fetchCommunities();
  }, []);

  // Join a community
  const joinCommunity = async (id: number) => {
    try {
      await axios.post(`http://localhost:5000/api/communities/join/${id}`); // Full URL to backend
      setJoined((prev) => [...prev, id]); // Mark the community as joined
      setCommunities((prev) =>
        prev.map((c) =>
          c.community_id === id
            ? { ...c, member_count: c.member_count + 1 }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to join community', err);
    }
  };

  return (
    <div className="pt-24">
      <Header />
      <h1 className="px-6 text-3xl font-bold mb-6 text-white">Communities</h1>
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((community) => (
          <div
            key={community.community_id}
            className="bg-white/10 text-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all"
          >
            <h2 className="text-xl font-semibold">{community.community_name}</h2>
            <p className="text-sm text-gray-300">Members: {community.member_count}</p>
            <button
              onClick={() => joinCommunity(community.community_id)}
              disabled={joined.includes(community.community_id)}
              className={`mt-4 px-4 py-2 rounded-full font-medium transition-all ${
                joined.includes(community.community_id)
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-[#FFD700] text-black hover:shadow-[0_0_10px_#FFD700]'
              }`}
            >
              {joined.includes(community.community_id) ? 'Joined' : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
