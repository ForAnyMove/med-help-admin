import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../api/client';

interface AdminUser {
  id: string;
  displayName: string;
  role: 'admin' | 'super_admin';
  email: string;
  language?: string;
  notifications_enabled?: boolean;
}

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import i18n from '../../i18n'; // Ensure we import the i18n instance

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyLanguage = (user: AdminUser) => {
    if (user.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  };

  useEffect(() => {
    // Check if logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const savedUser = localStorage.getItem('admin_user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid
          const data = await api.get<{ admin: AdminUser }>('/auth/me');
          setAdmin(data.admin);
          applyLanguage(data.admin);
          localStorage.setItem('admin_user', JSON.stringify(data.admin));
        } catch (error) {
          console.error('Session verification failed', error);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setAdmin(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, user: AdminUser) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    setAdmin(user);
    applyLanguage(user);
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('admin_token')) {
        await api.post('/auth/logout', {});
      }
    } catch (e) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
