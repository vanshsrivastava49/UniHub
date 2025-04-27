import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';

interface SearchWindowProps {
  onClose: () => void;
  regNo: string; // <-- Pass reg_no to search user
}

const SearchWindow = ({ onClose, regNo }: SearchWindowProps) => {
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        console.log('Fetching:', regNo);
        const res = await axios.get(`http://localhost:5000/api/user/search/${regNo}`);
        console.log('Student Data:', res.data);
        setStudent(res.data);
      } catch (err) {
        console.error('Failed to fetch student:', err);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [regNo]);

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (!student) return <div className="text-red-400 text-center mt-20">Student not found.</div>;

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white neon-text">Student Profile</h2>
          <button onClick={onClose} className="text-white hover:text-[#FFD700]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-black/30 backdrop-blur-md rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center space-x-6">
              <img src={student.image || "https://via.placeholder.com/150"} alt={student.fullname} className="w-32 h-32 rounded-full object-cover border-4 border-[#FFD700]" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{student.fullname}</h3>
                <p className="text-[#FFD700] mb-1">{student.reg_no}</p>
                <p className="text-gray-300">{student.course} • {student.enrolledyear}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="w-5 h-5 text-[#FFD700]" />
                  <span>{student.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="w-5 h-5 text-[#FFD700]" />
                  <span>{student.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5 text-[#FFD700]" />
                  <span>{student.location || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button className="flex-1 bg-[#FFD700] text-black font-semibold py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all">
                Send Message
              </button>
              <button className="flex-1 bg-transparent border border-[#FFD700] text-[#FFD700] py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all">
                Add to Friends
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchWindow;
