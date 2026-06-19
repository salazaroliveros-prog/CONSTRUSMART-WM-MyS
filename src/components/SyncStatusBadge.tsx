import React, { useEffect, useState } from 'react';
import { Badge, Tooltip, Spin } from 'antd';
import { Cloud, CloudOff, SyncIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useErp } from '@/erp/store';
import { toast } from '../FeedbackVisual';

export const SyncStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { syncStatus, syncError, mutationQueue, lastSyncedAt, isOnline } = useErp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (syncStatus === 'loading') {
      const key = toast.loading('Sincronizando datos con Supabase...', 'sync-loading');
      return () => toast.close(key);
    } else if (syncStatus === 'error') {
      toast.error(syncError || 'Error de sincronización con Supabase');
    } else if (syncStatus === 'synced') {
      const timeAgo = lastSyncedAt 
        ? `Sincronizado hace ${getTimeAgo(new Date(lastSyncedAt))}`
        : 'Sincronizado';
      toast.success(timeAgo);
    }
  }, [syncStatus, syncError, lastSyncedAt]);

  const getStatusColor = () => {
    if (syncStatus === 'synced') return 'success';
    if (syncStatus === 'loading') return 'processing';
    if (syncStatus === 'error') return 'error';
    if (syncStatus === 'queued') return 'warning';
    return 'default';
  };

  const getStatusIcon = () => {
    if (syncStatus === 'loading') return <SyncIcon size={14} className="animate-spin" />;
    if (syncStatus === 'error') return <AlertCircle size={14} />;
    if (syncStatus === 'synced') return <CheckCircle size={14} />;
    if (!isOnline) return <CloudOff size={14} />;
    return <Cloud size={14} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'loading') return 'Sincronizando...';
    if (syncStatus === 'error') return syncError?.slice(0, 30) || 'Error';
    if (syncStatus === 'queued') return `${mutationQueue.length} pendientes`;
    if (syncStatus === 'synced') {
      const time = lastSyncedAt ? getTimeAgo(new Date(lastSyncedAt)) : 'Sin sync';
      return `Sync hace ${time}`;
    }
    return 'Desconocido';
  };

  return (
    <Tooltip
      title={
        <div>
          <div>Estado: {syncStatus}</div>
          {syncError && <div>Error: {syncError}</div>}
          {lastSyncedAt && <div>Último sync: {new Date(lastSyncedAt).toLocaleString()}</div>}
          {mutationQueue.length > 0 && <div>Pendientes: {mutationQueue.length}</div>}
          {!isOnline && <div>Modo offline</div>}
        </div>
      }
    >
      <Badge
        status={getStatusColor()}
        className={`${className} cursor-pointer flex items-center gap-1`}
        onClick={() => setVisible(!visible)}
      >
        <Spin spinning={syncStatus === 'loading'} size="small">
          {getStatusIcon()}
        </Spin>
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
    </Tooltip>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
