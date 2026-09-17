import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authStorage } from '../services/api';
import { type CreatorProfile } from '../types';

interface AuthContextType {
  user: { id: string; email: string; username: string } | null;
  profile: CreatorProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, username: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string; username: string } | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await api.auth.me();
      if (data?.user) {
        setUser(data.user);
        setProfile(data.profile || null);
      } else {
        authStorage.removeToken();
        setUser(null);
        setProfile(null);
      }
    } catch (err: any) {
      if (err?.status !== 401) console.warn('Session refresh failed:', err);
      if (err?.status === 401) authStorage.removeToken();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string) => {
    await api.auth.login(email, pass);
    await refreshProfile();
  };

  const register = async (email: string, pass: string, username: string) => {
    await api.auth.register(email, pass, username);
    await refreshProfile();
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      login,
      register,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
