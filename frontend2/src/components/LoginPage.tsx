// src/LoginPage.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Header  from './Header';
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('userEmail', email);
      alert('Login successful');
      navigate('/dashboard'); // or home page
    } catch (error: any) {
      alert('Login failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div><Header/>
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-black/30 backdrop-blur-md rounded-lg p-8 my-8">
        <h2 className="text-3xl font-bold text-white mb-6 neon-text">Welcome Back</h2>
        <p className="text-gray-300 mb-8">Log in to connect with your peers, join clubs, and explore UniHub.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-white mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-white hover:text-[#FFD700] transition"
            >
              Don’t have an account?
            </button>
            <button
              type="submit"
              className="bg-[#FFD700] text-black font-semibold px-8 py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default LoginPage;
