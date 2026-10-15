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
  login: (user: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import i18n from '../../i18n'; // Ensure we import the i18n instance

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('admin_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const applyLanguage = (user: AdminUser) => {
    if (user.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  };

  useEffect(() => {
    // Check if logged in on mount
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('admin_user');
      
      // We rely on the /auth/me call automatically sending the HttpOnly cookie.
      // If we have a saved user, we try to fetch /me to verify the session.
      if (savedUser) {
        try {
          // Verify token is still valid
          const data = await api.get<{ admin: AdminUser }>('/auth/me');
          if (data?.admin) {
            setAdmin(data.admin);
            applyLanguage(data.admin);
            localStorage.setItem('admin_user', JSON.stringify(data.admin));
          }
        } catch (error: any) {
          console.error('Session verification failed', error);
          if (error?.message === 'Session expired') {
            localStorage.removeItem('admin_user');
            setAdmin(null);
          }
        }
      } else {
        setAdmin(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (user: AdminUser) => {
    localStorage.setItem('admin_user', JSON.stringify(user));
    setAdmin(user);
    applyLanguage(user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignore errors on logout
    } finally {
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
