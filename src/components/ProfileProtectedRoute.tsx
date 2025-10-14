import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProfileProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProfileProtectedRoute({ children }: ProfileProtectedRouteProps) {
  const { loading, checkProfileAccess } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Check if user has access to profile pages (allows expired users)
  if (!checkProfileAccess()) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
