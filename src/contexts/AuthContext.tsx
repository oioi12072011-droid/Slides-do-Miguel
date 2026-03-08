import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch existing profile to get real role
        let userRole: 'admin' | 'editor' | 'viewer';
        if (session.user.email === 'miguelcoaristimunha@gmail.com') {
          userRole = 'admin';
        } else {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          userRole = (profile?.role?.toLowerCase() as 'admin' | 'editor' | 'viewer') || 'viewer';
        }

        setUser({
          uid: session.user.id,
          email: session.user.email || '',
          role: userRole
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const handleAuthChange = async () => {
        if (session?.user) {
          // Fetch existing profile to preserve role
          let roleToSet: 'Admin' | 'Editor' | 'Viewer' = 'Viewer';

          if (session.user.email === 'miguelcoaristimunha@gmail.com') {
            roleToSet = 'Admin';
          } else {
            const { data: existingProfile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            roleToSet = (existingProfile?.role as 'Admin' | 'Editor' | 'Viewer') || 'Viewer';
          }

          // Create or update profile
          const { error } = await supabase.from('profiles').upsert({
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            role: roleToSet,
            is_online: true,
            last_seen: Date.now()
          }, { onConflict: 'id' });

          setUser({
            uid: session.user.id,
            email: session.user.email || '',
            role: roleToSet.toLowerCase() as 'admin' | 'editor' | 'viewer'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      };

      handleAuthChange();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (user) {
      // Set offline status
      await supabase.from('profiles').update({ is_online: false }).eq('id', user.uid);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
