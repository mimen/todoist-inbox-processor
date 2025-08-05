'use client'

import React from 'react'

interface AppHeaderProps {
  assigneeFilter: string
  onAssigneeFilterChange: (filter: string) => void
  viewMode: 'processing' | 'list'
  onViewModeChange: (mode: 'processing' | 'list') => void
  activeTab: 'projects' | 'shortcuts'
  onTabChange: (tab: 'projects' | 'shortcuts') => void
  currentUserId?: string
}

export default function AppHeader({
  assigneeFilter,
  onAssigneeFilterChange,
  viewMode,
  onViewModeChange,
  activeTab,
  onTabChange,
  currentUserId
}: AppHeaderProps) {

  const assigneeOptions = [
    { value: 'all', label: 'All tasks' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'assigned-to-me', label: 'Assigned to me' },
    { value: 'assigned-to-others', label: 'Assigned to others' },
    { value: 'not-assigned-to-others', label: 'Not assigned to others' }
  ]

  const currentAssigneeLabel = assigneeOptions.find(opt => opt.value === assigneeFilter)?.label || 'All tasks'

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-3">
        {/* Top row with title */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Task Processor
          </h1>
        </div>

        {/* Bottom row with filters and view controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Assignee filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeFilterChange(e.target.value)}
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {assigneeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
              <button
                onClick={() => onViewModeChange('processing')}
                className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                  viewMode === 'processing'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Projects/Shortcuts tabs */}
          <div className="flex items-center">
            <button
              onClick={() => onTabChange('projects')}
              className={`px-4 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'projects'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => onTabChange('shortcuts')}
              className={`px-4 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shortcuts'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Shortcuts
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}