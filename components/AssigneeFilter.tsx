'use client'

import { useState } from 'react'
import { TodoistTask } from '@/lib/types'

export type AssigneeFilterType = 'all' | 'unassigned' | 'assigned-to-me' | 'assigned-to-others' | 'not-assigned-to-others'

interface AssigneeFilterProps {
  value: AssigneeFilterType
  onChange: (value: AssigneeFilterType) => void
  tasks: TodoistTask[]
  currentUserId?: string
}

export default function AssigneeFilter({ value, onChange, tasks, currentUserId }: AssigneeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate task counts for each filter type
  const counts = tasks.reduce((acc, task) => {
    if (!task.assigneeId) {
      acc.unassigned++
      acc.notAssignedToOthers++
    } else if (task.assigneeId === currentUserId) {
      acc.assignedToMe++
      acc.notAssignedToOthers++
    } else {
      acc.assignedToOthers++
    }
    acc.all++
    return acc
  }, { all: 0, unassigned: 0, assignedToMe: 0, assignedToOthers: 0, notAssignedToOthers: 0 })

  const options = [
    { value: 'not-assigned-to-others' as AssigneeFilterType, label: 'Not assigned to others', count: counts.notAssignedToOthers },
    { value: 'all' as AssigneeFilterType, label: 'All tasks', count: counts.all },
    { value: 'unassigned' as AssigneeFilterType, label: 'Unassigned', count: counts.unassigned },
    { value: 'assigned-to-me' as AssigneeFilterType, label: 'Assigned to me', count: counts.assignedToMe },
    { value: 'assigned-to-others' as AssigneeFilterType, label: 'Assigned to others', count: counts.assignedToOthers },
  ]

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>{selectedOption.label}</span>
        <svg 
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span>{option.label}</span>
                {option.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    value === option.value 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}