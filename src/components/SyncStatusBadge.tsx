import { motion } from 'framer-motion'
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import { useErp } from '../erp/store'

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'pending'

export function SyncStatusBadge() {
  const { isOnline, syncStatus, mutationQueue } = useErp()
  const pendingCount = mutationQueue.length

  const getStatus = (): SyncStatus => {
    if (!isOnline) return 'offline'
    if (syncStatus === 'loading') return 'syncing'
    if (syncStatus === 'error') return 'error'
    if (pendingCount > 0) return 'pending'
    return 'synced'
  }

  const status = getStatus()

  const statusConfig = {
    synced: {
      icon: Check,
      label: 'Sincronizado',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    },
    syncing: {
      icon: RefreshCw,
      label: 'Sincronizando...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300'
    },
    offline: {
      icon: CloudOff,
      label: 'Sin conexión',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300'
    },
    error: {
      icon: AlertTriangle,
      label: 'Error de sync',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300'
    },
    pending: {
      icon: Cloud,
      label: `${pendingCount} pendientes`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.color} text-xs font-medium`}
    >
      <motion.div
        animate={status === 'syncing' ? { rotate: 360 } : {}}
        transition={status === 'syncing' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.div>
      <span>{config.label}</span>
    </motion.div>
  )
}
