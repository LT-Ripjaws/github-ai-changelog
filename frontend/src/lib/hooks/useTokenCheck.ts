"use client";
import { useState, useEffect } from 'react';
import { getMe } from '@/lib/api';

/** Lightweight auth check — verifies cookie auth by hitting /auth/me. */
export function useTokenCheck() {
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(() => setHasToken(true))
      .catch(() => setHasToken(false))
      .finally(() => setLoading(false));
  }, []);

  return { hasToken, loading };
}
