import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  preferredCurrency: string;
  timezone: string;
  monthlyBudget: number;
  alertThreshold: number;
  notifyOnThreshold: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; preferredCurrency?: string; timezone?: string }) => Promise<{ success: boolean; pendingApproval?: boolean; message?: string }>;
  demoLogin: (role: 'user' | 'admin') => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getToken()) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch {
      setToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleSessionExpired = () => {
      setToken(null);
      setTokenState(null);
      setUser(null);
    };

    window.addEventListener('kys:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('kys:session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string; preferredCurrency?: string; timezone?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      if (res.token) {
        setToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'user' | 'admin') => {
    if (role === 'admin') {
      await login('admin@kys.app', 'admin123');
    } else {
      await login('alex@example.com', 'password123');
    }
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  };

  const updateProfile = async (profile: Partial<User>) => {
    const res = await api.updateProfile(profile);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

