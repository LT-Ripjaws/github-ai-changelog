"use client";
import { useState, useEffect } from 'react';
import { getMe } from '@/lib/api';
import type { User } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then(setUser)
      .catch(() => { localStorage.removeItem('jwt_token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/';
  };

  return { user, loading, logout };
}
