"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { getRepoStatus } from '@/lib/api';
import type { RepoStatus } from '@/lib/types';

export function useRepoStatus(repoId: string | null) {
  const [status, setStatus] = useState<RepoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!repoId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getRepoStatus(repoId);
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  // Fetch immediately when repoId is set (enable polling)
  useEffect(() => {
    if (!repoId) {
      setStatus(null);
      pollingRef.current = false;
      return;
    }
    pollingRef.current = true;
    fetchStatus();
  }, [repoId, fetchStatus]);

  // Poll every 3 seconds while repo is syncing/pending
  useEffect(() => {
    if (!repoId || !pollingRef.current) return;

    const interval = setInterval(async () => {
      if (!pollingRef.current) return;
      
      try {
        const data = await getRepoStatus(repoId);
        setStatus(data);

        // Stop polling once sync is done
        if (data.status === 'ready' || data.status === 'error') {
          pollingRef.current = false;
        }
      } catch {
        // Keep trying on error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [repoId]);

  return { status, loading, error, refetch: fetchStatus, stop: () => { pollingRef.current = false; setStatus(null); } };
}
