'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from './api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'STAFF' | 'WARDEN' | 'SECURITY' | 'ADMIN' | 'ACADEMIC_OFFICER';
  permissions: string[];
  fullName?: string;
  rollNumber?: string;
  employeeId?: string;
  department?: string;
  specialization?: string;
  branch?: string;
  year?: number;
  hostelBlock?: string;
  roomNumber?: string;
}

export interface RegisterStudentData {
  fullName: string;
  email: string;
  rollNumber: string;
  department: string;
  year: number | string;
  hostel?: string;
  roomNumber?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  loginWithFeedback: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterStudentData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchPersona: (persona: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getRoleDashboard = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return '/student/dashboard';
      case 'STAFF':
        return '/staff/dashboard';
      case 'WARDEN':
        return '/warden/dashboard';
      case 'SECURITY':
        return '/security/dashboard';
      case 'ACADEMIC_OFFICER':
        return '/academic/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: UserProfile }>('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithFeedback = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    if (res.success && res.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_token', res.data.token);
      }
      setUser(res.data.user);
      setLoading(false);
      router.push(getRoleDashboard(res.data.user.role));
      return { success: true };
    }

    setLoading(false);
    return {
      success: false,
      error: res.error?.message || 'Invalid username/email or password.',
    };
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    const result = await loginWithFeedback(usernameOrEmail, password);
    return result.success;
  };

  const register = async (
    data: RegisterStudentData
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.success && res.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_token', res.data.token);
      }
      setUser(res.data.user);
      setLoading(false);
      router.push(getRoleDashboard(res.data.user.role));
      return { success: true };
    }

    setLoading(false);
    return {
      success: false,
      error: res.error?.message || 'Registration failed. Please verify your details.',
    };
  };

  const logout = async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexora_token');
    }
    setUser(null);
    router.push('/login');
  };

  const switchPersona = async (persona: string) => {
    setLoading(true);
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/switch-persona', {
      method: 'POST',
      body: JSON.stringify({ persona }),
    });

    if (res.success && res.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_token', res.data.token);
      }
      setUser(res.data.user);
      setLoading(false);
      router.push(getRoleDashboard(res.data.user.role));
    } else {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithFeedback,
        register,
        logout,
        switchPersona,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
