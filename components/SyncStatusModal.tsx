'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Database,
  Hash,
  FileText
} from 'lucide-react'

interface CalendarSyncInfo {
  calendarId: string
  calendarName: string
  eventCount: number
  syncToken?: string
  lastSync: string | null
  lastFullSync: string | null
  metadata: {
    color?: string
    timeZone?: string
    accessRole?: string
  }
}

interface SyncStatusModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SyncStatusModal({ isOpen, onClose }: SyncStatusModalProps) {
  const [calendars, setCalendars] = useState<CalendarSyncInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [freshSyncing, setFreshSyncing] = useState(false)
  const [globalStats, setGlobalStats] = useState({
    totalEvents: 0,
    totalCalendars: 0,
    lastFullSync: null as string | null,
    syncInProgress: false
  })

  const fetchSyncStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calendar/sync/detailed-status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch sync status')
      }
      
      const data = await response.json()
      setCalendars(data.calendars || [])
      setGlobalStats({
        totalEvents: data.totalEvents || 0,
        totalCalendars: data.totalCalendars || 0,
        lastFullSync: data.lastFullSync,
        syncInProgress: data.syncInProgress || false
      })
      setError(null)
    } catch (err) {
      console.error('Failed to fetch sync status:', err)
      setError('Failed to load sync status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchSyncStatus()
    }
  }, [isOpen])

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/calendar/sync', { method: 'GET' })
      if (!response.ok) {
        throw new Error('Sync failed')
      }
      
      // Wait a bit then refresh the status
      setTimeout(() => {
        fetchSyncStatus()
        setSyncing(false)
      }, 2000)
    } catch (error) {
      console.error('Manual sync failed:', error)
      setSyncing(false)
      setError('Manual sync failed')
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const truncateSyncToken = (token?: string): string => {
    if (!token) return 'No token'
    if (token.length <= 20) return token
    return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="w-full max-w-5xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Calendar Sync Status
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-gray-100 focus:outline-none"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

                {/* Global Stats */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Total Calendars</span>
                      </div>
                      <p className="text-xl font-semibold">{globalStats.totalCalendars}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Hash className="w-4 h-4" />
                        <span>Total Events</span>
                      </div>
                      <p className="text-xl font-semibold">{globalStats.totalEvents}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Last Full Sync</span>
                      </div>
                      <p className="text-sm font-medium">{formatDate(globalStats.lastFullSync)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Database className="w-4 h-4" />
                        <span>Sync Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {globalStats.syncInProgress || syncing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm">Syncing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Idle</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleManualSync}
                      disabled={syncing || globalStats.syncInProgress}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync All Calendars
                    </button>
                  </div>
                </div>

                {/* Calendar Details - Compact Table View */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600">{error}</p>
                      </div>
                    </div>
                  ) : calendars.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No calendars synced yet
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-700 bg-gray-50">Calendar</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-700 bg-gray-50">Events</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700 bg-gray-50">Last Sync</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700 bg-gray-50">Sync Token</th>
                          <th className="text-center px-2 py-2 font-medium text-gray-700 bg-gray-50">Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {calendars.map((calendar) => (
                          <tr key={calendar.calendarId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-sm flex-shrink-0"
                                  style={{ 
                                    backgroundColor: calendar.metadata.color || '#4285f4',
                                    border: '1px solid rgba(0,0,0,0.15)'
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 truncate text-sm" title={calendar.calendarName}>
                                    {calendar.calendarName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate" title={calendar.calendarId}>
                                    {calendar.calendarId.split('@')[0]}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {calendar.eventCount}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="text-sm text-gray-900">{formatDate(calendar.lastSync)}</div>
                              {calendar.lastFullSync && (
                                <div className="text-xs text-gray-500">
                                  Full: {formatDate(calendar.lastFullSync)}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1">
                                <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                                  {truncateSyncToken(calendar.syncToken)}
                                </code>
                                {calendar.syncToken && (
                                  <button
                                    onClick={() => navigator.clipboard.writeText(calendar.syncToken!)}
                                    className="text-gray-400 hover:text-gray-600 p-0.5"
                                    title="Copy full token"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {calendar.metadata.timeZone && (
                                  <span className="text-xs text-gray-500" title={`Timezone: ${calendar.metadata.timeZone}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {calendar.metadata.accessRole && (
                                  <span className="text-xs text-gray-500" title={`Access: ${calendar.metadata.accessRole}`}>
                                    {calendar.metadata.accessRole === 'owner' ? '👑' : '👤'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
              <span>Sync tokens enable incremental updates</span>
              <button
                onClick={fetchSyncStatus}
                className="text-blue-500 hover:text-blue-600"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}