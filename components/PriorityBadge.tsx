import React from 'react'

interface PriorityBadgeProps {
  priority: 1 | 2 | 3 | 4 | null
  className?: string
}

const PRIORITY_CONFIG = {
  4: { label: 'P1', color: 'text-red-600', bgColor: 'bg-red-50' },
  3: { label: 'P2', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  2: { label: 'P3', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  1: { label: 'P4', color: 'text-gray-600', bgColor: 'bg-gray-50' }
}

export default function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  if (!priority) return null
  
  const config = PRIORITY_CONFIG[priority]
  if (!config) return null
  
  return (
    <span 
      className={`
        inline-flex items-center px-1.5 py-0.5 
        text-xs font-medium rounded
        ${config.color} ${config.bgColor}
        ${className}
      `}
    >
      {config.label}
    </span>
  )
}