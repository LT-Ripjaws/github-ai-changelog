"use client";
import { useState, useEffect } from 'react';
import { getMe } from '@/lib/api';
import type { User } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    console.log('[useAuth] token exists:', !!token);
    if (!token) { setLoading(false); return; }
    getMe()
      .then((u) => {
        console.log('[useAuth] getMe success:', u.username);
        setUser(u);
      })
      .catch((err) => {
        console.log('[useAuth] getMe failed:', err?.response?.status);
        localStorage.removeItem('jwt_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    console.log('[useAuth] logout called, clearing token');
    localStorage.removeItem('jwt_token');
    setUser(null);
    // Use replace to prevent back button from returning to authenticated state
    window.location.replace('/');
  };

  return { user, loading, logout };
}
