import React from 'react';
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import ParticleBackground from "@/components/ParticleBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
        <p className="text-2xl text-white/70 mb-8">Oops! Page not found</p>
        <a 
          href="/" 
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 inline-block"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
