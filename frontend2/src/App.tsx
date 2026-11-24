import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import SearchPage from './components/SearchPage';
import RegisterPage from './components/Register';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import PostsPage from './components/PostsPage';
import CommunityPage from './components/Community';
import ChatsPage from './components/ChatsPage';
import ProtectedRoute from './components/ProtectedRoute';
import TeamFinderPage from './components/TeamFinderPage';
import StaffEventsPage from './components/StaffEventsPage';
import AdminEventsPage from './components/AdminEventsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#5D2F99] via-[#D53A74] to-[#1C89E7] animate-gradient">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/search/:reg_no" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
          <Route path="/team-finder" element={<ProtectedRoute><TeamFinderPage /></ProtectedRoute>} />
          <Route path="/staff/events" element={<ProtectedRoute><StaffEventsPage /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute><AdminEventsPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;