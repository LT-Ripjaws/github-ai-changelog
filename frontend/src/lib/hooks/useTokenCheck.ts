"use client";
import { useState, useEffect } from 'react';
import { getMe } from '@/lib/api';

/** Lightweight auth check — verifies cookie auth by hitting /auth/me. */
export function useTokenCheck() {
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMe()
      .then(() => { if (active) setHasToken(true); })
      .catch(() => { if (active) setHasToken(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { hasToken, loading };
}
