import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole | null;
  isSuperAdmin: boolean;
  accessibleEventIds: string[]; // empty means all events if role is admin with no specific restriction
  hasAccessToAll: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  demoLoginAs: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessibleEventIds, setAccessibleEventIds] = useState<string[]>([]);
  const [hasAccessToAll, setHasAccessToAll] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user profile and event permissions from Supabase
  const loadUserProfile = async (userId: string, email: string) => {
    try {
      const isUserEmailSuperAdmin = email.toLowerCase() === 'ananda.poji@gmail.com';

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr || !profileData) {
        // Fallback default profile if not yet populated
        const fallbackProfile: Profile = {
          id: userId,
          nama: isUserEmailSuperAdmin ? 'Ananda Poji (Super Admin)' : email.split('@')[0],
          email: email,
          role: isUserEmailSuperAdmin ? 'super_admin' : 'admin',
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setHasAccessToAll(isUserEmailSuperAdmin);
        return;
      }

      // If user is ananda.poji@gmail.com, always enforce super_admin
      const effectiveRole: UserRole = isUserEmailSuperAdmin ? 'super_admin' : profileData.role;
      const effectiveProfile: Profile = {
        ...profileData,
        role: effectiveRole,
      };

      setProfile(effectiveProfile);

      if (effectiveRole === 'super_admin') {
        setHasAccessToAll(true);
        setAccessibleEventIds([]);
      } else {
        // Check admin_event_access
        const { data: accessData } = await supabase
          .from('admin_event_access')
          .select('event_id')
          .eq('admin_id', userId);

        if (!accessData || accessData.length === 0) {
          // Rule: admin without specific access rows can access all events
          setHasAccessToAll(true);
          setAccessibleEventIds([]);
        } else {
          setHasAccessToAll(false);
          setAccessibleEventIds(accessData.map((row: any) => row.event_id));
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    // Check initial session
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadUserProfile(session.user.id, session.user.email || '');
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadUserProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
          setAccessibleEventIds([]);
          setHasAccessToAll(true);
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Check local storage for mock/demo session
      const savedSession = localStorage.getItem('kobar_demo_admin_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setHasAccessToAll(parsed.profile.role === 'super_admin');
        } catch {
          // ignore error
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await loadUserProfile(data.user.id, data.user.email || email);
      }
      setIsLoading(false);
      return {};
    } else {
      // Direct local authentication for testing
      const isSuper = email.toLowerCase() === 'ananda.poji@gmail.com' || password === 'KobarExpo2026SuperAdmin!' || email.includes('superadmin');
      
      const adminUser = { 
        id: isSuper ? 'super-admin-ananda' : `admin-${Date.now()}`, 
        email: email.trim() 
      };
      
      const adminProfile: Profile = {
        id: adminUser.id,
        nama: email.toLowerCase() === 'ananda.poji@gmail.com' ? 'Ananda Poji (Super Admin)' : email.split('@')[0],
        email: email.trim(),
        role: isSuper ? 'super_admin' : 'admin',
        created_at: new Date().toISOString(),
      };

      setUser(adminUser);
      setProfile(adminProfile);
      setHasAccessToAll(isSuper);
      localStorage.setItem('kobar_demo_admin_session', JSON.stringify({ user: adminUser, profile: adminProfile }));
      setIsLoading(false);
      return {};
    }
  };

  const logout = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('kobar_demo_admin_session');
    setUser(null);
    setProfile(null);
    setAccessibleEventIds([]);
    setHasAccessToAll(true);
    setIsLoading(false);
  };

  const demoLoginAs = (role: UserRole) => {
    const isSuper = role === 'super_admin';
    const adminUser = {
      id: isSuper ? 'super-admin-ananda' : 'admin-panitia-kobar',
      email: isSuper ? 'ananda.poji@gmail.com' : 'panitia@kobarexpo.id',
    };
    const adminProfile: Profile = {
      id: adminUser.id,
      nama: isSuper ? 'Ananda Poji (Super Admin)' : 'Panitia Divisi Kobar',
      email: adminUser.email,
      role,
      created_at: new Date().toISOString(),
    };
    setUser(adminUser);
    setProfile(adminProfile);
    setHasAccessToAll(isSuper);
    localStorage.setItem('kobar_demo_admin_session', JSON.stringify({ user: adminUser, profile: adminProfile }));
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        isSuperAdmin,
        accessibleEventIds,
        hasAccessToAll,
        isLoading,
        login,
        logout,
        demoLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
