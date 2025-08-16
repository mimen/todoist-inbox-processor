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
  FileText,
  Settings
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
  const [syncInterval, setSyncInterval] = useState<number>(15)
  const [showSettings, setShowSettings] = useState(false)
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
      // Load sync interval from localStorage and API
      const savedInterval = localStorage.getItem('calendarSyncInterval')
      if (savedInterval) {
        setSyncInterval(parseInt(savedInterval))
      }
      
      // Also fetch current interval from server
      fetch('/api/calendar/sync/interval')
        .then(res => res.json())
        .then(data => {
          if (data.interval && !savedInterval) {
            setSyncInterval(data.interval)
            localStorage.setItem('calendarSyncInterval', data.interval.toString())
          }
        })
        .catch(console.error)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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

  const handleFreshSync = async () => {
    if (!confirm('This will clear all sync tokens and perform a complete re-sync of all calendars. This may take a while. Continue?')) {
      return
    }
    
    setFreshSyncing(true)
    try {
      const response = await fetch('/api/calendar/sync/fresh', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Fresh sync failed')
      }
      
      // Wait longer for fresh sync then refresh the status
      setTimeout(() => {
        fetchSyncStatus()
        setFreshSyncing(false)
      }, 5000)
    } catch (error) {
      console.error('Fresh sync failed:', error)
      setFreshSyncing(false)
      setError('Fresh sync failed')
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

  const handleSyncIntervalChange = async (newInterval: number) => {
    try {
      const response = await fetch('/api/calendar/sync/interval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: newInterval })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update interval')
      }
      
      setSyncInterval(newInterval)
      localStorage.setItem('calendarSyncInterval', newInterval.toString())
    } catch (error) {
      console.error('Failed to update sync interval:', error)
      setError('Failed to update sync interval')
    }
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
                  
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={handleFreshSync}
                        disabled={syncing || freshSyncing || globalStats.syncInProgress}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Clear all sync tokens and perform a complete re-sync"
                      >
                        <RefreshCw className={`w-4 h-4 ${freshSyncing ? 'animate-spin' : ''}`} />
                        Fresh Sync
                      </button>
                      <button
                        onClick={handleManualSync}
                        disabled={syncing || freshSyncing || globalStats.syncInProgress}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        Sync Updates
                      </button>
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                {showSettings && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Sync Settings</h4>
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-600">
                        Sync Interval (minutes):
                      </label>
                      <select
                        value={syncInterval}
                        onChange={(e) => handleSyncIntervalChange(parseInt(e.target.value))}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">1 minute</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                      <span className="text-xs text-gray-500">
                        Calendars will only sync if their last sync was older than this interval
                      </span>
                    </div>
                  </div>
                )}

                {/* Calendar Details - Grouped by Ownership */}
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
                  ) : (() => {
                    // Group calendars by ownership
                    const myCalendars = calendars.filter(cal => cal.metadata.accessRole === 'owner')
                    const otherCalendars = calendars.filter(cal => cal.metadata.accessRole !== 'owner')
                    
                    return (
                      <>
                        {/* My Calendars */}
                        {myCalendars.length > 0 && (
                          <>
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                              <h4 className="text-sm font-medium text-gray-700">My Calendars</h4>
                            </div>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Calendar</th>
                                  <th className="text-center px-2 py-2 font-medium text-gray-600 text-xs">Events</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Last Sync</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Sync Token</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {myCalendars.map((calendar) => (
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
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                        
                        {/* Other Calendars */}
                        {otherCalendars.length > 0 && (
                          <>
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 mt-4">
                              <h4 className="text-sm font-medium text-gray-700">Other Calendars</h4>
                            </div>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Calendar</th>
                                  <th className="text-center px-2 py-2 font-medium text-gray-600 text-xs">Events</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Last Sync</th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Sync Token</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {otherCalendars.map((calendar) => (
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
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>
                </div>

                {/* Sync Progress Message */}
                {(syncing || freshSyncing || globalStats.syncInProgress) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {freshSyncing 
                          ? 'Performing fresh sync of all calendars... This may take a while.'
                          : 'Syncing calendar updates...'
                        }
                      </span>
                    </div>
                  </div>
                )}

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