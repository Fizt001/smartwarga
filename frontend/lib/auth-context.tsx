'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi, getToken, removeToken, setToken, UserProfile } from './api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isPengurus: boolean;
  isApproved: boolean;
  viewMode: 'desktop' | 'mobile';
  toggleViewMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isPengurus: false,
  isApproved: false,
  viewMode: 'mobile',
  toggleViewMode: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('mobile');
    }
  }, []);

  const refreshUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await fetchApi('/auth/profile');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        removeToken();
        setUser(null);
      }
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: UserProfile) => {
    setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      removeToken();
      setUser(null);
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'mobile' ? 'desktop' : 'mobile'));
  };

  const isPengurus = Boolean(
    user && ['super_admin', 'rw', 'rt', 'bendahara', 'sekretaris'].includes(user.role)
  );

  const isApproved = Boolean(user && user.status === 'approved');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isPengurus,
        isApproved,
        viewMode,
        toggleViewMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
