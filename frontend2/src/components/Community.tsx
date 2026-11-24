import React, { useEffect, useState } from 'react';
import api from '../api';
import Header from './Header';

interface Community {
  community_id: number;
  community_name: string;
  member_count: number;
  joined: boolean;
}

const CommunityPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await api.get('/api/communities');
        setCommunities(res.data);
      } catch (err) {
        console.error('Error fetching communities', err);
        setError('Failed to load communities');
      }
    };
    fetchCommunities();
  }, []);

  const joinCommunity = async (id: number) => {
    try {
      await api.post(`/api/communities/join/${id}`);
      setCommunities((prev) =>
        prev.map((c) =>
          c.community_id === id
            ? { ...c, joined: true, member_count: c.member_count + 1 }
            : c
        )
      );
    } catch (err: any) {
      // 409 means already a member, so just mark it as joined
      if (err.response?.status === 409) {
        setCommunities((prev) =>
          prev.map((c) => (c.community_id === id ? { ...c, joined: true } : c))
        );
      } else {
        setError(err.response?.data?.error || 'Failed to join community');
      }
    }
  };

  return (
    <div className="pt-24">
      <Header />
      <h1 className="px-6 text-3xl font-bold mb-6 text-white">Communities</h1>
      {error && <p className="px-6 text-red-400 mb-4">{error}</p>}
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
              disabled={community.joined}
              className={`mt-4 px-4 py-2 rounded-full font-medium transition-all ${
                community.joined
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-[#FFD700] text-black hover:shadow-[0_0_10px_#FFD700]'
              }`}
            >
              {community.joined ? 'Joined' : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;