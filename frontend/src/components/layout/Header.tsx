import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center md:hidden">
        <button className="text-muted-foreground hover:text-foreground">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="hidden md:flex items-center w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search everywhere (Cmd+K)..." 
          className="w-full h-10 pl-10 pr-4 rounded-md border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
        </button>
        <button onClick={signOut} className="text-sm font-medium hover:underline text-muted-foreground">
          Sign out
        </button>
      </div>
    </header>
  );
};
