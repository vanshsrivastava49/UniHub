import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/api/auth');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/Login';
    }
    return Promise.reject(err);
  }
);

export const mediaUrl = (path: string) => `${API_URL}${path}`;

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/Login';
};

export default api;