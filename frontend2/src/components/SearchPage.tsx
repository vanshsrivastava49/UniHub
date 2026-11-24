import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Header from './Header';

interface User {
  id: number;
  reg_no: string;
  fullname: string;
  course: string;
  enrolledyear: string;
  gender: string;
  college_name: string;
  address: string;
}

const SearchPage: React.FC = () => {
  const { reg_no } = useParams<{ reg_no: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      // Reset state so searching a second RA number doesn't show stale results
      setLoading(true);
      setError('');
      setUser(null);
      setRequestStatus('');
      try {
        const response = await api.get(`/api/user/search/${encodeURIComponent(reg_no!)}`);
        setUser(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'User not found');
      } finally {
        setLoading(false);
      }
    };

    if (reg_no) fetchUser();
  }, [reg_no]);

  const sendFriendRequest = async () => {
    if (!user) return;
    try {
      await api.post('/api/friends/send', { friend_user_id: user.id });
      setRequestStatus('Friend request sent');
    } catch (err: any) {
      setRequestStatus(err.response?.data?.error || 'Could not send friend request');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-10 bg-gradient-to-br from-[#5D2F99] via-[#D53A74] to-[#1C89E7] animate-gradient">
      <Header />
      <div className="max-w-3xl mx-auto bg-black/40 backdrop-blur-md rounded-xl p-8 shadow-xl border border-[#FFD700]/30">
        {loading ? (
          <p className="text-center text-lg text-gray-300">Searching for student info...</p>
        ) : error ? (
          <p className="text-center text-red-400 text-lg">{error}</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6 text-[#FFD700] neon-text text-center">
              Student Details
            </h1>
            <div className="space-y-4 text-white/90">
              <InfoItem label="Registration Number" value={user?.reg_no} />
              <InfoItem label="Full Name" value={user?.fullname} />
              <InfoItem label="Course" value={user?.course} />
              <InfoItem label="Enrolled Year" value={user?.enrolledyear} />
              <InfoItem label="Gender" value={user?.gender} />
              <InfoItem label="College" value={user?.college_name} />
              <InfoItem label="Address" value={user?.address} />
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={sendFriendRequest}
                className="bg-[#FFD700] text-black font-semibold px-6 py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all"
              >
                Add Friend
              </button>
              {requestStatus && <p className="text-white mt-3">{requestStatus}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/10 pb-2">
    <span className="font-semibold">{label}:</span>
    <span>{value || 'N/A'}</span>
  </div>
);

export default SearchPage;