'use client'

import React from 'react'
import { ViewMode } from '@/types/view-mode'

interface ViewModeToggleProps {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  taskCount: number
  isLoading?: boolean
}

/**
 * Toggle component for switching between Processing and List views
 * Shows task count in List view button
 * Keyboard shortcuts: V to toggle, P for Processing, L for List
 */
export default function ViewModeToggle({ 
  mode, 
  onModeChange, 
  taskCount,
  isLoading = false 
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <button
        onClick={() => onModeChange('processing')}
        disabled={isLoading}
        title="Processing View (P)"
        aria-label="Switch to Processing View"
        className={`
          px-3 py-1.5 text-sm font-medium rounded transition-colors
          ${mode === 'processing' 
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
      >
        <span className="flex items-center gap-2">
          {/* Processing icon - single square */}
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="6" y="6" width="4" height="4" rx="0.5" fill="currentColor"/>
          </svg>
          <span>Processing</span>
        </span>
      </button>
      
      <button
        onClick={() => onModeChange('list')}
        disabled={isLoading}
        title="List View (L)"
        aria-label="Switch to List View"
        className={`
          px-3 py-1.5 text-sm font-medium rounded transition-colors
          ${mode === 'list' 
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
      >
        <span className="flex items-center gap-2">
          {/* List icon - three lines */}
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5h10M3 8h10M3 11.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>List</span>
          {taskCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({taskCount})
            </span>
          )}
        </span>
      </button>
    </div>
  )
}

/**
 * Loading shimmer for ViewModeToggle
 * Use when the component needs to be shown but data is still loading
 */
export function ViewModeToggleSkeleton() {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  )
}