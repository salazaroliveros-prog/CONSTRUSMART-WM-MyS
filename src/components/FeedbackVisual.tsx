import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react'

export type FeedbackType = 'success' | 'error' | 'loading' | 'info'

export interface FeedbackVisualProps {
  type: FeedbackType
  message: string
  visible: boolean
  onClose?: () => void
  duration?: number
}

const feedbackConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  info: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  }
}

export function FeedbackVisual({
  type,
  message,
  visible,
  onClose,
  duration = 3000
}: FeedbackVisualProps) {
  const config = feedbackConfig[type]
  const Icon = config.icon

  React.useEffect(() => {
    if (visible && type !== 'loading' && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, type, duration, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
        >
          <motion.div
            animate={type === 'loading' ? { rotate: 360 } : {}}
            transition={type === 'loading' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            className={`${config.color}`}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
          <span className="text-sm font-medium text-gray-800 flex-1">{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
