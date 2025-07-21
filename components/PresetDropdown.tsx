'use client'

import { useState, useEffect, useRef } from 'react'
import { PRESET_FILTERS, PresetFilter } from '@/types/processing-mode'
import { TodoistTask } from '@/lib/types'

interface PresetDropdownProps {
  selectedPreset: string
  onPresetChange: (presetId: string, displayName: string) => void
  allTasks: TodoistTask[]
  projectMetadata?: Record<string, any>
}

export default function PresetDropdown({
  selectedPreset,
  onPresetChange,
  allTasks = [],
  projectMetadata = {}
}: PresetDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedFilter = PRESET_FILTERS.find(f => f.id === selectedPreset)

  const handlePresetSelect = (preset: PresetFilter) => {
    onPresetChange(preset.id, preset.name)
    setIsOpen(false)
  }

  // Calculate task counts for each preset
  const getTaskCount = (preset: PresetFilter) => {
    // Filter out archived tasks first (those starting with "* ")
    const activeTasks = allTasks.filter(task => !task.content.startsWith('* '))
    
    const count = activeTasks.filter(task => {
      try {
        return preset.filter(task, projectMetadata)
      } catch (error) {
        console.error(`Error applying filter ${preset.id}:`, error)
        return false
      }
    }).length
    
    return count
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedFilter ? (
            <>
              <span className="text-lg">{selectedFilter.icon}</span>
              <span className="font-medium text-gray-900">{selectedFilter.name}</span>
              <span className="text-gray-500">
                ({getTaskCount(selectedFilter)})
              </span>
            </>
          ) : (
            <span className="text-gray-500">Select preset filter...</span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="max-h-64 overflow-y-auto">
            {PRESET_FILTERS.map((preset) => {
              const taskCount = getTaskCount(preset)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full flex items-start space-x-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedPreset === preset.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        selectedPreset === preset.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {preset.name}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {taskCount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{preset.description}</p>
                  </div>
                  {selectedPreset === preset.id && (
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}