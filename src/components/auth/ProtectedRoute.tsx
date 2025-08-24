import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'marketing' | 'finance' | 'commercial';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, userRole, loading, memberStatus } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show pending/declined states
  if (memberStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 rounded-xl border border-white/10 bg-white/5">
          <h2 className="text-2xl font-semibold mb-2">Awaiting approval</h2>
          <p className="text-sm text-muted-foreground">Please wait for your company administrator to approve your access.</p>
        </div>
      </div>
    );
  }

  if (memberStatus === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 rounded-xl border border-white/10 bg-white/5">
          <h2 className="text-2xl font-semibold mb-2">Access request declined</h2>
          <p className="text-sm text-muted-foreground">Contact your company administrator if you believe this is a mistake.</p>
        </div>
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};