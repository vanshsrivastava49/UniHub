// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header'; 
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';
import SearchPage from './components/SearchPage';
import RegisterPage from './components/Register';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage'; 
import PostsPage from './components/PostsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#5D2F99] via-[#D53A74] to-[#1C89E7] animate-gradient">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/Login" element={<LoginPage/>}/>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/posts" element={<PostsPage/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;