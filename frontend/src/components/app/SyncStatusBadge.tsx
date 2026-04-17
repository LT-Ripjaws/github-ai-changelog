"use client";
import { Badge } from '@/components/ui/badge';

interface SyncStatusBadgeProps {
  status: 'pending' | 'syncing' | 'ready' | 'error';
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const };
      case 'syncing':
        return { label: 'Syncing...', variant: 'default' as const };
      case 'ready':
        return { label: 'Ready', variant: 'default' as const };
      case 'error':
        return { label: 'Error', variant: 'destructive' as const };
      default:
        return { label: 'Unknown', variant: 'outline' as const };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
