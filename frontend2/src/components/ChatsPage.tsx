import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './Header';

interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  media_url: string | null;
  created_at: string;
  fullname: string;
  email: string;
}

const ChatsPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/chats');
      setMessages(res.data);
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = localStorage.getItem('userEmail');
    if (!email || !newMessage.trim()) return;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('message', newMessage);
    if (mediaFile) formData.append('media', mediaFile);

    try {
      await axios.post('http://localhost:5000/api/chats', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewMessage('');
      setMediaFile(null);
      fetchMessages();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen pt-10 pb-20">
      <Header />
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white text-2xl font-semibold mb-6 text-center">Chat Room</h2>

          {/* Chat Box */}
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-6 mb-8 max-h-[500px] overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-6 border-b border-gray-700 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[#FFD700] font-semibold">{msg.fullname}</h4>
                  <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <p className="text-white mb-3">{msg.message}</p>
                {msg.media_url && (
                  <div>
                    {msg.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={`http://localhost:5000${msg.media_url}`}
                        alt="chat-media"
                        className="rounded-md max-h-60 w-auto"
                      />
                    ) : (
                      <video
                        controls
                        className="rounded-md max-h-60 w-auto"
                      >
                        <source src={`http://localhost:5000${msg.media_url}`} />
                      </video>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="bg-black/30 backdrop-blur-md rounded-lg p-6">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              rows={3}
              required
            />
            <div className="flex justify-between items-center">
              <input
                type="file"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="text-white"
                accept="image/*,video/*"
              />
              <button
                type="submit"
                className="bg-[#FFD700] text-black font-semibold px-6 py-2 rounded-full hover:shadow-[0_0_15px_#FFD700] transition-all"
              >
                Send
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
