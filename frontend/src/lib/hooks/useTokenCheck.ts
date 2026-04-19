"use client";
import { useState, useEffect } from 'react';

/** Lightweight auth check — just checks if JWT exists in localStorage. No API call. */
export function useTokenCheck() {
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    setHasToken(!!token);
    setLoading(false);
  }, []);

  return { hasToken, loading };
}
