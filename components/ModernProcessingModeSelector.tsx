'use client'

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { ProcessingMode, ProcessingModeType, PROCESSING_MODE_OPTIONS } from '@/types/processing-mode'
import { ChevronDown, Check } from 'lucide-react'
import ProjectDropdown from './ProjectDropdown'
import PriorityDropdown from './PriorityDropdown'
import LabelDropdown from './LabelDropdown'
import DateDropdown from './DateDropdown'
import DeadlineDropdown from './DeadlineDropdown'
import PresetDropdown from './PresetDropdown'
import AllTasksDropdown from './AllTasksDropdown'
import PrioritizedDropdown from './PrioritizedDropdown'
import { TodoistProject, TodoistTask, TodoistLabel } from '@/lib/types'
import { getActiveTasks, getQueueTaskCount } from '@/lib/task-filters'
import { useQueueConfig } from '@/hooks/useQueueConfig'
import { useQueueProgression } from '@/hooks/useQueueProgression'
import { useCurrentModeOptions } from '@/hooks/useCurrentModeOptions'

// Define ProjectMetadata type locally
interface ProjectMetadata {
  description?: string
  category?: string | null
  priority?: number | null
}

interface ModernProcessingModeSelectorProps {
  mode: ProcessingMode
  onModeChange: (mode: ProcessingMode) => void
  projects: TodoistProject[]
  allTasks: TodoistTask[]
  allTasksGlobal?: TodoistTask[]
  taskCounts: Record<string, number>
  labels?: TodoistLabel[]
  projectMetadata?: Record<string, ProjectMetadata>
  currentUserId?: string
  assigneeFilter?: string
}

interface ProcessingModeSelectorRef {
  switchToMode: (type: ProcessingModeType) => void
  openCurrentDropdown: () => void
  queueState: any
}

const ModernProcessingModeSelector = forwardRef<ProcessingModeSelectorRef, ModernProcessingModeSelectorProps>(({
  mode,
  onModeChange,
  projects,
  allTasks,
  allTasksGlobal = [],
  taskCounts,
  labels = [],
  projectMetadata = {},
  currentUserId,
  assigneeFilter = 'all'
}: ModernProcessingModeSelectorProps, ref) => {
  const queueConfig = useQueueConfig()
  const [selectedProcessingType, setSelectedProcessingType] = useState<ProcessingModeType>(mode.type as ProcessingModeType)
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const modeDropdownRef = useRef<HTMLDivElement>(null)
  
  // Refs for each dropdown
  const projectDropdownRef = useRef<any>(null)
  const priorityDropdownRef = useRef<any>(null)
  const labelDropdownRef = useRef<any>(null)
  const dateDropdownRef = useRef<any>(null)
  const deadlineDropdownRef = useRef<any>(null)
  const presetDropdownRef = useRef<any>(null)
  const allTasksDropdownRef = useRef<any>(null)
  const prioritizedDropdownRef = useRef<any>(null)

  // Get active tasks
  const activeTasks = getActiveTasks(allTasks, assigneeFilter as any, currentUserId)
  const filteredTasks = activeTasks

  // Get current mode options
  const currentModeOptions = useCurrentModeOptions({
    mode: mode.type as ProcessingModeType,
    projects,
    allTasks: filteredTasks,
    labels,
    projectMetadata
  })

  // Use queue progression
  const queueState = useQueueProgression({
    dropdownOptions: currentModeOptions,
    config: queueConfig,
    currentValue: []
  })


  const handleModeTypeChange = (newType: ProcessingModeType) => {
    setSelectedProcessingType(newType)
    setShowModeDropdown(false)
    
    // Reset queue progression when changing modes
    if ('resetQueueProgress' in queueState && typeof queueState.resetQueueProgress === 'function') {
      queueState.resetQueueProgress()
    }

    // Open the appropriate dropdown
    setTimeout(() => {
      switch (newType) {
        case 'project':
          projectDropdownRef.current?.openDropdown()
          break
        case 'priority':
          priorityDropdownRef.current?.openDropdown()
          break
        case 'label':
          labelDropdownRef.current?.openDropdown()
          break
        case 'date':
          dateDropdownRef.current?.openDropdown()
          break
        case 'deadline':
          deadlineDropdownRef.current?.openDropdown()
          break
        case 'preset':
          presetDropdownRef.current?.openDropdown()
          break
        case 'all':
          allTasksDropdownRef.current?.openDropdown()
          break
        case 'prioritized':
          prioritizedDropdownRef.current?.openDropdown()
          break
      }
    }, 100)
  }

  // Helper function to open current dropdown
  const openCurrentDropdown = () => {
    switch (selectedProcessingType) {
      case 'project':
        projectDropdownRef.current?.openDropdown()
        break
      case 'priority':
        priorityDropdownRef.current?.openDropdown()
        break
      case 'label':
        labelDropdownRef.current?.openDropdown()
        break
      case 'date':
        dateDropdownRef.current?.openDropdown()
        break
      case 'deadline':
        deadlineDropdownRef.current?.openDropdown()
        break
      case 'preset':
        presetDropdownRef.current?.openDropdown()
        break
      case 'all':
        allTasksDropdownRef.current?.openDropdown()
        break
      case 'prioritized':
        prioritizedDropdownRef.current?.openDropdown()
        break
    }
  }

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    switchToMode: (type: ProcessingModeType) => {
      handleModeTypeChange(type)
      setTimeout(() => openCurrentDropdown(), 150)
    },
    openCurrentDropdown,
    queueState
  }), [queueState, selectedProcessingType, handleModeTypeChange])

  const handleValueChange = (value: string | string[], displayName: string) => {
    // For prioritized mode, we need to handle queue jumping differently
    if (selectedProcessingType === 'prioritized' && typeof value === 'string') {
      try {
        // Parse the JSON value to get the actual queue selection
        const parsedValue = JSON.parse(value)
        
        // Find the index based on matching the queue configuration
        const selectedIndex = currentModeOptions.findIndex(option => {
          // For priority-projects, we need special handling
          if (parsedValue.filterType === 'priority-projects' && option.metadata?.isPriorityProject) {
            // Match based on the project ID and priority
            return option.id === parsedValue.filterValue && 
                   option.metadata.originalPriority === parseInt(parsedValue.isPriorityProject)
          }
          
          // For regular types, match based on type and filter value
          return option.type === parsedValue.filterType && 
                 option.id === parsedValue.filterValue
        })

        // Jump to the selected queue if found
        if (selectedIndex !== -1) {
          if ('jumpToQueue' in queueState && typeof queueState.jumpToQueue === 'function') {
            (queueState as any).jumpToQueue(selectedIndex)
          }
        }
      } catch (e) {
        console.error('Error parsing prioritized value:', e)
      }
    } else {
      // For other modes, find the index normally
      const selectedIndex = currentModeOptions.findIndex(option => {
        if (Array.isArray(value)) {
          // For multi-select (labels), match if the arrays are equal
          return Array.isArray(option.id) && 
            value.length === option.id.length && 
            value.every(v => option.id.includes(v))
        }
        return option.id === value
      })

      // Jump to the selected queue if found
      if (selectedIndex !== -1) {
        if ('jumpToQueue' in queueState && typeof queueState.jumpToQueue === 'function') {
          (queueState as any).jumpToQueue(selectedIndex)
        }
      }
    }

    onModeChange({
      ...mode,
      type: selectedProcessingType,
      value,
      displayName
    })
  }

  // Get icon for mode type
  const getModeIcon = (type: ProcessingModeType) => {
    switch (type) {
      case 'prioritized': return '📋'
      case 'project': return '#'
      case 'priority': return '🚩'
      case 'label': return '🏷️'
      case 'date': return '📅'
      case 'deadline': return '⏰'
      case 'preset': return '✨'
      case 'all': return '📊'
      default: return '📋'
    }
  }

  const currentModeOption = PROCESSING_MODE_OPTIONS.find(opt => opt.type === selectedProcessingType)

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
        {/* Mode selector button */}
        <div className="relative" ref={modeDropdownRef}>
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <span className="text-sm">{getModeIcon(selectedProcessingType)}</span>
            <span>{currentModeOption?.label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Mode dropdown */}
          {showModeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                {PROCESSING_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleModeTypeChange(option.type)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getModeIcon(option.type)}</span>
                      <span>{option.label}</span>
                    </div>
                    {selectedProcessingType === option.type && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Value selector */}
        <div className="flex-1">
          {selectedProcessingType === 'project' && (
            <ProjectDropdown
              ref={projectDropdownRef}
              projects={projects}
              selectedProjectId={mode.value as string}
              onProjectChange={(projectId) => {
                const project = projects.find(p => p.id === projectId)
                handleValueChange(projectId, project?.name || 'Unknown')
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'priority' && (
            <PriorityDropdown
              ref={priorityDropdownRef}
              selectedPriority={mode.value as string}
              onPriorityChange={(priority, displayName) => {
                handleValueChange(priority, displayName)
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'label' && (
            <LabelDropdown
              ref={labelDropdownRef}
              selectedLabels={Array.isArray(mode.value) ? mode.value : []}
              onLabelsChange={(labels, displayName) => {
                handleValueChange(labels, displayName)
              }}
              availableLabels={Array.from(new Set(allTasks.flatMap(task => task.labels))).sort()}
              allTasks={filteredTasks}
              labelObjects={labels}
            />
          )}

          {selectedProcessingType === 'date' && (
            <DateDropdown
              ref={dateDropdownRef}
              selectedDate={mode.value as string}
              onDateChange={(date, displayName) => {
                handleValueChange(date, displayName)
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'deadline' && (
            <DeadlineDropdown
              ref={deadlineDropdownRef}
              selectedDeadline={mode.value as string}
              onDeadlineChange={(deadline, displayName) => {
                handleValueChange(deadline, displayName)
              }}
              allTasks={filteredTasks}
            />
          )}

          {selectedProcessingType === 'preset' && (
            <PresetDropdown
              ref={presetDropdownRef}
              selectedPreset={mode.value as string}
              onPresetChange={(presetId, displayName) => {
                handleValueChange(presetId, displayName)
              }}
              allTasks={allTasksGlobal.length > 0 ? allTasksGlobal.filter(task => {
                if (assigneeFilter === 'all') return true
                
                switch (assigneeFilter) {
                  case 'unassigned':
                    return !task.assigneeId
                  case 'assigned-to-me':
                    return task.assigneeId === currentUserId
                  case 'assigned-to-others':
                    return task.assigneeId && task.assigneeId !== currentUserId
                  case 'not-assigned-to-others':
                    return !task.assigneeId || task.assigneeId === currentUserId
                  default:
                    return true
                }
              }) : filteredTasks}
              projectMetadata={projectMetadata}
            />
          )}

          {selectedProcessingType === 'all' && (
            <AllTasksDropdown
              ref={allTasksDropdownRef}
              selectedSort={mode.value as string}
              onSortChange={(sortBy, displayName) => {
                handleValueChange(sortBy, displayName)
              }}
              allTasks={allTasksGlobal.length > 0 ? allTasksGlobal.filter(task => {
                if (assigneeFilter === 'all') return true
                
                switch (assigneeFilter) {
                  case 'unassigned':
                    return !task.assigneeId
                  case 'assigned-to-me':
                    return task.assigneeId === currentUserId
                  case 'assigned-to-others':
                    return task.assigneeId && task.assigneeId !== currentUserId
                  case 'not-assigned-to-others':
                    return !task.assigneeId || task.assigneeId === currentUserId
                  default:
                    return true
                }
              }) : filteredTasks}
            />
          )}

          {selectedProcessingType === 'prioritized' && (
            <PrioritizedDropdown
              ref={prioritizedDropdownRef}
              selectedValue={mode.value as string}
              onModeChange={(newMode) => {
                // Extract the display name from the mode
                handleValueChange(newMode.value, newMode.displayName)
              }}
              projects={projects}
              allTasks={filteredTasks}
              projectMetadata={projectMetadata}
            />
          )}
        </div>

        {/* Current value display */}
        {mode.value && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{mode.displayName}</span>
          </div>
        )}
      </div>
    </div>
  )
})

ModernProcessingModeSelector.displayName = 'ModernProcessingModeSelector'

export default ModernProcessingModeSelector