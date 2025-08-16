'use client'

import React from 'react'
import { ProcessingMode } from '@/types/processing-mode'
import PriorityFlag from '../../PriorityFlag'

// Todoist color mapping
const getTodoistColor = (colorName: string) => {
  const colorMap: { [key: string]: string } = {
    'berry_red': '#b8256f',
    'red': '#db4035',
    'orange': '#ff9933',
    'yellow': '#fad000',
    'olive_green': '#afb83b',
    'lime_green': '#7ecc49',
    'green': '#299438',
    'mint_green': '#6accbc',
    'teal': '#158fad',
    'sky_blue': '#4073ff',
    'light_blue': '#96c3eb',
    'blue': '#4073ff',
    'grape': '#884dff',
    'violet': '#af38eb',
    'lavender': '#eb96eb',
    'magenta': '#e05194',
    'salmon': '#ff8d85',
    'charcoal': '#808080',
    'grey': '#b8b8b8',
    'taupe': '#ccac93'
  }
  return colorMap[colorName] || '#808080'
}

interface MultiListHeaderProps {
  processingMode: ProcessingMode
  taskCount: number
  icon?: string
  color?: string
}

/**
 * Minimal header component for multi-list view
 * Shows list name, count, and relevant icons/indicators
 */
export default function MultiListHeader({
  processingMode,
  taskCount,
  icon,
  color
}: MultiListHeaderProps) {
  // Determine what type of indicator to show
  const renderIndicator = () => {
    // Use type-specific indicators based on processing mode
    switch (processingMode.type) {
      case 'project':
        // Show project color dot using Todoist color system
        const projectColor = color ? getTodoistColor(color) : null
        return projectColor ? (
          <div 
            className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
            style={{ backgroundColor: projectColor }}
          />
        ) : icon ? (
          // Fallback to icon if no color (e.g., inbox)
          <span className="text-base mr-2">{icon}</span>
        ) : null
        
      case 'priority':
        // Use the existing PriorityFlag component
        const priority = parseInt(processingMode.value as string) as 1 | 2 | 3 | 4
        return priority ? (
          <div className="mr-2">
            <PriorityFlag priority={priority} className="w-4 h-4" />
          </div>
        ) : null
        
      case 'label':
      case 'date':
      case 'deadline':
      case 'preset':
        // For these types, use the icon if provided
        return icon ? <span className="text-base mr-2">{icon}</span> : null
        
      default:
        // For custom types or other types, use icon if available
        return icon ? <span className="text-base mr-2">{icon}</span> : null
    }
  }
  
  return (
    <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        {renderIndicator()}
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
          {processingMode.displayName}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {taskCount}
        </span>
      </div>
    </div>
  )
}