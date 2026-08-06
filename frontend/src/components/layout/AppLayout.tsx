import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatbot } from '@/features/ai/AIChatbot';

export const AppLayout: React.FC = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted"></div>
          <div className="h-4 w-32 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <Outlet />
        </main>
      </div>
      {userRole === 'manager' && <AIChatbot />}
    </div>
  );
};
