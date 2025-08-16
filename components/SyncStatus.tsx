'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { SyncStatusModal } from './overlays'

interface SyncStatusData {
  lastSync: string | null
  syncInProgress: boolean
  error: string | null
}

export default function SyncStatus() {
  const [showModal, setShowModal] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({
    lastSync: null,
    syncInProgress: false,
    error: null
  })

  // Poll sync status
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const response = await fetch('/api/calendar/sync/status')
        if (response.ok) {
          const data = await response.json()
          setSyncStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error)
      }
    }

    // Initial fetch
    fetchSyncStatus()

    // Poll every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }))
    
    try {
      const response = await fetch('/api/calendar/sync', { method: 'GET' })
      if (!response.ok) {
        throw new Error('Sync failed')
      }
      
      // Refresh status after sync
      setTimeout(async () => {
        const statusResponse = await fetch('/api/calendar/sync/status')
        if (statusResponse.ok) {
          const data = await statusResponse.json()
          setSyncStatus(data)
        }
      }, 1000)
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: false,
        error: 'Manual sync failed'
      }))
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          {syncStatus.syncInProgress ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Syncing...</span>
            </>
          ) : syncStatus.error ? (
            <>
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{syncStatus.error}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {syncStatus.lastSync 
                  ? `${formatRelativeTime(syncStatus.lastSync)}`
                  : 'Never synced'
                }
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleManualSync}
            disabled={syncStatus.syncInProgress}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Manually sync calendars"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="View detailed sync status"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
      </div>

      <SyncStatusModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  )
}