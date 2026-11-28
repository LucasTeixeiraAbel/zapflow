'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('zapflow_token');
    const storedUser = localStorage.getItem('zapflow_user');
    const storedTenant = localStorage.getItem('zapflow_tenant');

    if (storedToken && storedUser && storedTenant) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setTenant(JSON.parse(storedTenant));
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newTenant: Tenant) => {
    localStorage.setItem('zapflow_token', newToken);
    localStorage.setItem('zapflow_user', JSON.stringify(newUser));
    localStorage.setItem('zapflow_tenant', JSON.stringify(newTenant));
    setToken(newToken);
    setUser(newUser);
    setTenant(newTenant);
  };

  const logout = () => {
    localStorage.removeItem('zapflow_token');
    localStorage.removeItem('zapflow_user');
    localStorage.removeItem('zapflow_tenant');
    setToken(null);
    setUser(null);
    setTenant(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, tenant, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
