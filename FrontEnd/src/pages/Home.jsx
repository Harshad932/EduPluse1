import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import VisionMission from '../components/VisionMission';
import Goals from '../components/Goals';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Gallery from '../components/Gallery';
import Mentor from '../components/Mentor';
import Team from '../components/Team';
import Footer from '../components/Footer';

export default function Home({ onOpenAuth, onOpenDashboard }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenAuth={onOpenAuth} onOpenDashboard={onOpenDashboard} />
      <main style={{ flex: 1 }}>
        <Hero />
        <About />
        <VisionMission />
        <Features />
        <HowItWorks />
        <Gallery />
        <Mentor />
        <Team />
      </main>
      <Footer />
    </div>
  );
}
