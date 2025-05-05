// src/RegisterPage.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Header from './Header';
interface FormData {
  fullname: string;
  reg_no: string;
  course: string;
  enrolledyear: string;
  collegeid: string;
  gender: string;
  email: string;
  password: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<FormData>({
    fullname: '',
    reg_no: '',
    course: '',
    enrolledyear: '',
    collegeid: '',
    gender: '',
    email: '',
    password: ''
  });
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      alert('Registration successful');
      navigate('/'); // Navigate to home page after successful registration
    } catch (error: any) {
      alert('Registration failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20">
<Header/>
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-md rounded-lg p-8 my-8">
        <h2 className="text-3xl font-bold text-white mb-6 neon-text">Join UniHub</h2>
        <p className="text-gray-300 mb-8">Create your account to connect with other students, join clubs, and discover events on campus.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullname" className="block text-white mb-2">Full Name</label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={form.fullname}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="reg_no" className="block text-white mb-2">Registration Number</label>
              <input
                type="text"
                id="reg_no"
                name="reg_no"
                value={form.reg_no}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="course" className="block text-white mb-2">Course</label>
              <select
                id="course"
                name="course"
                value={form.course}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
              >
                <option value="" className="text-black">Select Course</option>
                <option value="cse core" className="text-black">CSE Core</option>
                <option value="ai/ml" className="text-black">CSE AI/ML</option>
                <option value="dsbs" className="text-black">CSE DSBS</option>
                <option value="ece" className="text-black">ECE</option>
                <option value="eee" className="text-black">EEE</option>
                <option value="mech" className="text-black">Mechanical</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="enrolledyear" className="block text-white mb-2">Enrolled Year</label>
              <input
                type="text"
                id="enrolledyear"
                name="enrolledyear"
                value={form.enrolledyear}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
                pattern="20[0-9]{2}"
                title="Please enter a valid enrollment year (e.g., 2023)"
              />
            </div>
            
            <div>
              <label htmlFor="collegeid" className="block text-white mb-2">College ID</label>
              <input
                type="text"
                id="collegeid"
                name="collegeid"
                value={form.collegeid}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-white mb-2">Gender</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
              >
                <option value="" className="text-black">Select Gender</option>
                <option value="male" className="text-black">Male</option>
                <option value="female" className="text-black">Female</option>
                <option value="other" className="text-black">Other</option>
                <option value="prefer_not_to_say" className="text-black">Prefer not to say</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-white mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
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
                value={form.password}
                onChange={handleChange}
                className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-white hover:text-[#FFD700] transition"
            >
              Back to Home
            </button>
            <button
              type="submit"
              className="bg-[#FFD700] text-black font-semibold px-8 py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all"
            >
              Register
            </button>
          </div>
          <p className="text-center text-white">
  Already have an account?{' '}
  <span
    onClick={() => navigate('/login')}
    className="text-[#FFD700] hover:underline cursor-pointer"
  >
    Login here
  </span>
</p>
        </form>
      </div>
    </div>
    </div>
  );
};

export default RegisterPage;