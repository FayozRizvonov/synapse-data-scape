import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import ParticleBackground from '@/components/ParticleBackground';
import Glow from '@/components/ai/Glow';
import { CLAIRE_LOGO_SRC } from '@/constants/branding';

export const Auth: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to main page
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render form if user is authenticated (prevents flash)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-main">
      <ParticleBackground />
      <Glow />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10">
              <img src={CLAIRE_LOGO_SRC} alt="CLAIRE" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">CLAIRE AI AGENT</h1>
            <p className="text-sm text-gray-700/70 dark:text-white/60">Commercial Life Science AI Recommendation Engine Agent</p>
          </div>
          <AuthForm onSuccess={() => navigate('/')} />
        </div>
      </div>
    </div>
  );
};