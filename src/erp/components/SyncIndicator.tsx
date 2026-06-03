import React from 'react';
import { useErp } from '../store';
import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';

const SyncIndicator: React.FC = () => {
  const { isOnline, mutationQueue, syncMessage, forceSync } = useErp();
  const pendientes = mutationQueue.length;

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de conexión */}
      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
        isOnline 
          ? 'bg-emerald-50 text-emerald-600' 
          : 'bg-amber-50 text-amber-600'
      }`}>
        {isOnline ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">
          {isOnline ? 'En línea' : 'Sin conexión'}
        </span>
      </div>

      {/* Badge de pendientes si hay cambios sin sincronizar */}
      {pendientes > 0 && (
        <button
          onClick={forceSync}
          className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-100 transition-colors"
          title={`${pendientes} cambios pendientes de sincronizar`}
        >
          <Cloud className="w-3 h-3" />
          <span className="font-semibold">{pendientes}</span>
          <RefreshCw className="w-3 h-3 ml-0.5" />
        </button>
      )}

      {/* Mensaje de sincronización temporal */}
      {syncMessage && (
        <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg animate-pulse">
          {syncMessage}
        </div>
      )}
    </div>
  );
};

export default SyncIndicator;