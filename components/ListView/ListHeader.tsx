'use client'

import React from 'react'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewSortOption } from '@/types/view-mode'

interface ListHeaderProps {
  processingMode: ProcessingMode
  taskCount: number
  sortBy: ListViewSortOption
  onSortChange: (sortBy: ListViewSortOption) => void
}

/**
 * Header component for List View
 * Shows current queue context and sort controls
 */
export default function ListHeader({
  processingMode,
  taskCount,
  sortBy,
  onSortChange
}: ListHeaderProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {processingMode.displayName}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-gray-600 dark:text-gray-400">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as ListViewSortOption)}
            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default Order</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Newest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>
    </div>
  )
}