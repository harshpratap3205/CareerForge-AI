'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, scheduleSilentRefresh, stopSilentRefresh } from '../lib/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'CONSULTANT';
  phone?: string;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (tokens: { accessToken: string }, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const res = await api.get('/auth/me');
          setUser(res.data.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.data.user));
          scheduleSilentRefresh(token);
        } catch {
          // Attempt silent refresh via HttpOnly cookie if access token expired
          try {
            const refreshRes = await api.post('/auth/refresh');
            const newAccessToken = refreshRes.data.data.tokens.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            scheduleSilentRefresh(newAccessToken);
            const userRes = await api.get('/auth/me');
            setUser(userRes.data.data.user);
            localStorage.setItem('user', JSON.stringify(userRes.data.data.user));
          } catch {
            stopSilentRefresh();
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (tokens: { accessToken: string }, userData: User) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    scheduleSilentRefresh(tokens.accessToken);
    setUser(userData);
  };

  const logout = async () => {
    stopSilentRefresh();
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network failure
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
