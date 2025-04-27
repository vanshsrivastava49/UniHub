// src/pages/HomePage.js

import React from 'react';
import Header from './Header';
import Hero from './Hero';

const HomePage = () => {
  return (
    <div>
      {/* Fixed Header/Navbar */}
      <Header />
      
      {/* Hero Content Below */}
      <main className="pt-0">
        <Hero />
      </main>
    </div>
  );
};

export default HomePage;