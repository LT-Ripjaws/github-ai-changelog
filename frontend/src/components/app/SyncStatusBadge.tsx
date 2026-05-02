"use client";
import { Badge } from '@/components/ui/badge';

interface SyncStatusBadgeProps {
  status: 'pending' | 'syncing' | 'ready' | 'error';
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', className: 'badge-linear-neutral' };
      case 'syncing':
        return { label: 'Syncing...', className: 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20' };
      case 'ready':
        return { label: 'Ready', className: 'badge-linear-success' };
      case 'error':
        return { label: 'Error', className: 'bg-destructive/10 text-destructive border border-destructive/20' };
      default:
        return { label: 'Unknown', className: 'badge-linear-neutral' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
