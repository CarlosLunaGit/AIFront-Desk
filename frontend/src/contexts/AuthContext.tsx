import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLogin, useMe } from '../services/hooks/useAuth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const loginMutation = useLogin();
  const meQuery = useMe();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginMutation.mutateAsync({ email, password });
      const { token, user } = data;
      localStorage.setItem('auth_token', token);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [loginMutation]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      setUser(null);
      return;
    }
    if (token && meQuery.data) {
      setUser(meQuery.data);
    } else if (!token) {
      setUser(null);
    }
  }, [meQuery.data]);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 