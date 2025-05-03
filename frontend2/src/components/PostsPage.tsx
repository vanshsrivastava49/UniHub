import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';

interface Post {
  post_id: number;
  user_id: number;
  content: string;
  media_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  fullname: string; // from user table
}

const PostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        setError('Please login to create a post');
        return;
      }
  
      if (!newPost.trim()) {
        setError('Post content cannot be empty');
        return;
      }
  
      // Create FormData object
      const formData = new FormData();
      formData.append('content', newPost);
      formData.append('email', email);
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
  
      // Use formData in the request and set correct headers
      const response = await axios.post('http://localhost:5000/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.status === 201) {
        setNewPost('');
        setMediaFile(null);
        setError(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchPosts(); // Refresh the posts list
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
      console.error('Error creating post:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5D2F99] via-[#D53A74] to-[#1C89E7]">
      <Header />
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-2xl mx-auto">
          {/* Create Post Form */}
          <form onSubmit={handleSubmit} className="bg-black/30 backdrop-blur-md rounded-lg p-6 mb-8">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-white/10 border border-gray-600 text-white rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              rows={3}
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
                Post
              </button>
            </div>
          </form>

          {/* Posts List */}
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {posts.map((post) => (
            <div key={post.post_id} className="bg-black/30 backdrop-blur-md rounded-lg p-6 mb-4">
              <div className="flex items-center mb-4">
                <div className="text-white">
                  <h3 className="font-semibold">{post.fullname}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-white mb-4">{post.content}</p>
              {post.media_url && (
  <div className="mb-4">
    {post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
      <img
        src={`http://localhost:5000${post.media_url}`}
        alt="Post media"
        className="rounded-lg max-h-96 w-auto"
      />
    ) : (
      <video
        controls
        className="rounded-lg max-h-96 w-auto"
      >
        <source src={`http://localhost:5000${post.media_url}`} />
      </video>
    )}
  </div>
)}
              <div className="flex space-x-4 text-gray-400">
                <button className="flex items-center space-x-1 hover:text-[#FFD700]">
                  <span>❤️ {post.likes_count}</span>
                </button>
                <button className="flex items-center space-x-1 hover:text-[#FFD700]">
                  <span>💬 {post.comments_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostsPage;