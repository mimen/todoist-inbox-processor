'use client'

import React from 'react'

interface MultiListModeIndicatorProps {
  isActive: boolean
}

export default function MultiListModeIndicator({ isActive }: MultiListModeIndicatorProps) {
  if (!isActive) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 6h16M4 10h16M4 14h16M4 18h16" 
        />
      </svg>
      <span>Multi-List Mode</span>
    </div>
  )
}