import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'manager' | 'customer';
  switchRole: (role: 'manager' | 'customer') => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: 'manager',
  switchRole: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'manager' | 'customer'>('manager');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        // Demo mode fallback
        setUser({ id: 'demo-user', email: 'demo@example.com' } as any);
      }
      setLoading(false);
    }).catch(error => {
      console.error("Auth initialization error, falling back to demo mode:", error);
      setUser({ id: 'demo-user', email: 'demo@example.com' } as any);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      // In demo mode (no Supabase), keep the demo user alive — don't log out
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchRole = (role: 'manager' | 'customer') => {
    setUserRole(role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, switchRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
