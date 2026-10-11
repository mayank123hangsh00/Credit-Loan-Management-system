'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cs_token');
    const savedUser = localStorage.getItem('cs_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (typeof document !== 'undefined') {
          document.cookie = `cs_token=${savedToken}; path=/; max-age=604800; SameSite=Lax`;
        }
      } catch {
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
      }
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (data: AuthResponse) => {
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    if (typeof document !== 'undefined') {
      document.cookie = `cs_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
    }
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    saveAuth(data);
  };

  const register = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
    saveAuth(data);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    if (typeof document !== 'undefined') {
      document.cookie = 'cs_token=; path=/; max-age=0; SameSite=Lax';
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      setUser(data.user);
      localStorage.setItem('cs_user', JSON.stringify(data.user));
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
