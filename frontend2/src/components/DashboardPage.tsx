import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from "./Header";
interface User {
  id: string;
  fullname: string;
  reg_no: string;
  course: string;
  enrolledyear: string;
  collegeid: string;
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
      <Header/>
    <div className="min-h-screen pt-20 px-6">
      <h1 className="text-3xl font-bold text-white mb-6 neon-text">Student Dashboard</h1>
      <div className="overflow-x-auto bg-black/30 backdrop-blur-md rounded-lg p-6">
        <table className="min-w-full text-white">
          <thead>
            <tr className="bg-[#FFD700] text-black">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Reg No</th>
              <th className="px-4 py-2">Course</th>
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">College ID</th>
              <th className="px-4 py-2">Gender</th>
              <th className="px-4 py-2">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-white/10 transition">
              <td className="px-4 py-2">{user.fullname}</td>
              <td className="px-4 py-2">{user.reg_no}</td>
              <td className="px-4 py-2">{user.course}</td>
              <td className="px-4 py-2">{user.enrolledyear}</td>
              <td className="px-4 py-2">{user.collegeid}</td>
              <td className="px-4 py-2">{user.gender}</td>
              <td className="px-4 py-2">{user.email}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default DashboardPage;