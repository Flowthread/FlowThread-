import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroFuturistic from './ui/hero-futuristic';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <HeroFuturistic onGetStarted={() => navigate('/login')} />
    </div>
  );
}
