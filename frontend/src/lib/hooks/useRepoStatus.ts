"use client";
import { useState, useEffect, useCallback } from 'react';
import { getRepoStatus } from '@/lib/api';
import type { RepoStatus } from '@/lib/types';

export function useRepoStatus(repoId: string | null, initialStatus?: RepoStatus) {
  const [status, setStatus] = useState<RepoStatus | null>(initialStatus || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Initial fetch
  useEffect(() => {
    if (repoId && !initialStatus) {
      fetchStatus();
    }
  }, [repoId, initialStatus, fetchStatus]);

  // Poll every 3 seconds when syncing
  useEffect(() => {
    if (!repoId || status?.status !== 'syncing') return;

    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [repoId, status?.status, fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
}
