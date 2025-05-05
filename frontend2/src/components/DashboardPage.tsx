import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from "./Header";

interface User {
  id: string;
  fullname: string;
  reg_no: string;
  course: string;
  enrolledyear: string;
  college_name: string;
  gender: string;
  email: string;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
          setError('User email not found. Please login again.');
          return;
        }

        const res = await axios.get(`http://localhost:5000/api/dashboard/users?email=${email}`);
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data. Please try again later.');
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <p className="text-red-500 text-center mt-6">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <p className="text-gray-300 text-center mt-6">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen pt-20 px-6 flex justify-center items-center">
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-8 text-white w-full max-w-md shadow-lg">
          <div className="flex flex-col items-center">
            {/* Profile Image as Background */}
            <div
              className="w-32 h-32 rounded-full border-4 border-yellow-400 mb-4 bg-cover bg-center"
              style={{ backgroundImage: "url('https://i.pravatar.cc/150?img=3')" }}
            ></div>

            <h2 className="text-2xl font-bold neon-text mb-1">{user.fullname}</h2>
            <p className="text-yellow-300 text-sm mb-6">{user.email}</p>
          </div>
          <div className="space-y-3">
            <p><span className="font-semibold text-yellow-400">Reg No:</span> {user.reg_no}</p>
            <p><span className="font-semibold text-yellow-400">Course:</span> {user.course}</p>
            <p><span className="font-semibold text-yellow-400">Enrolled Year:</span> {user.enrolledyear}</p>
            <p><span className="font-semibold text-yellow-400">College:</span> {user.college_name}</p>
            <p><span className="font-semibold text-yellow-400">Gender:</span> {user.gender}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
