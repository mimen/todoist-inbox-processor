'use client'

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate, TodoistUser } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewState } from '@/types/view-mode'
import { filterTasksByMode } from '@/lib/task-filters'
import { AssigneeFilterType } from '@/components/AssigneeFilter'
import { useQueueConfig } from '@/hooks/useQueueConfig'
import { usePrioritizedOptions } from '@/hooks/usePrioritizedOptions'
import { useSettingsContext } from '@/contexts/SettingsContext'
import ListView from './ListView'

interface MultiListContainerProps {
  masterTasks: Record<string, TodoistTask>
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  labels: TodoistLabel[]
  processingMode: ProcessingMode
  projectMetadata: Record<string, any>
  listViewState: ListViewState
  slidingOutTaskIds: string[]
  onListViewStateChange: (state: ListViewState) => void
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  onTaskComplete: (taskId: string) => void
  onTaskProcess: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
  onViewModeChange: (mode: 'processing') => void
  currentUserId: string
  assigneeFilter: AssigneeFilterType
  collaborators?: Record<string, TodoistUser[]>
  // Overlay handlers
  onOpenProjectOverlay: (taskId: string) => void
  onOpenPriorityOverlay: (taskId: string) => void
  onOpenLabelOverlay: (taskId: string) => void
  onOpenScheduledOverlay: (taskId: string) => void
  onOpenDeadlineOverlay: (taskId: string) => void
  onOpenAssigneeOverlay: (taskId: string) => void
}

interface ListData {
  id: string
  label: string
  icon?: React.ReactNode
  tasks: TodoistTask[]
  filterType: string
  filterValue: string
}

/**
 * Multi-List Container Component
 * Simple load more button approach with global navigation
 */
const MultiListContainer: React.FC<MultiListContainerProps> = ({
  masterTasks,
  allTasks,
  projects,
  labels,
  processingMode,
  projectMetadata,
  listViewState,
  slidingOutTaskIds,
  onListViewStateChange,
  onTaskUpdate,
  onTaskComplete,
  onTaskProcess,
  onTaskDelete,
  onViewModeChange,
  currentUserId,
  assigneeFilter,
  collaborators = {},
  onOpenProjectOverlay,
  onOpenPriorityOverlay,
  onOpenLabelOverlay,
  onOpenScheduledOverlay,
  onOpenDeadlineOverlay,
  onOpenAssigneeOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(3) // Start with 3 lists
  const [globalHighlightedTaskId, setGlobalHighlightedTaskId] = useState<string | null>(null)
  const [isMetaKeyHeld, setIsMetaKeyHeld] = useState(false)
  const config = useQueueConfig()
  const { settings } = useSettingsContext()

  // Get prioritized options to determine queue order
  const prioritizedOptions = usePrioritizedOptions(
    allTasks,
    config.prioritizedQueue?.sequence || [],
    projectMetadata,
    projects
  )

  // Build list data from prioritized options
  const listData = useMemo((): ListData[] => {
    // If duplicate filtering is enabled, track which tasks we've already shown
    const shownTaskIds = settings.listView.duplicateFiltering ? new Set<string>() : null

    const rawLists = prioritizedOptions.map((option, index) => {
      // Parse the filter details from the option
      let filterType = option.type || 'project'
      let filterValue = option.id

      // Special handling for inbox project
      if (option.id === 'inbox') {
        // Find the actual inbox project
        const inboxProject = projects.find(p => p.isInboxProject)
        if (inboxProject) {
          filterType = 'project'
          filterValue = inboxProject.id
        }
      }
      // For prioritized queue items, extract the actual filter info
      else if (option.metadata?.isPriorityProject) {
        filterType = 'project'
        filterValue = option.id
      }

      // Get tasks for this specific queue/list
      const listProcessingMode: ProcessingMode = {
        type: filterType as any,
        value: filterValue,
        displayName: option.label
      }

      let tasks = filterTasksByMode(
        allTasks,
        listProcessingMode,
        projectMetadata,
        'all',  // assigneeFilter already applied in allTasks
        currentUserId
      )

      // Apply duplicate filtering if enabled
      if (shownTaskIds) {
        tasks = tasks.filter(task => {
          if (shownTaskIds.has(task.id)) {
            return false // Skip tasks we've already shown
          }
          shownTaskIds.add(task.id) // Mark this task as shown
          return true
        })
      }

      return {
        id: `${index}`,
        label: option.label,
        icon: option.icon,
        tasks,
        filterType,
        filterValue,
      }
    })
    
    // Apply filtering - in multi-list mode, only show lists with tasks
    const filteredLists = rawLists.filter(list => list.tasks.length > 0)
    
    return filteredLists
  }, [prioritizedOptions, allTasks, projectMetadata, currentUserId, config, settings.listView.duplicateFiltering, projects])

  // Get visible lists
  const visibleLists = listData.slice(0, visibleCount)
  const hasMore = visibleCount < listData.length

  // Create a flat array of all visible tasks for navigation
  const allVisibleTasks = useMemo(() => {
    const tasks: { task: TodoistTask; listIndex: number }[] = []
    visibleLists.forEach((list, listIndex) => {
      list.tasks.forEach(task => {
        tasks.push({ task, listIndex })
      })
    })
    return tasks
  }, [visibleLists])

  // Initialize highlighted task on first load
  useEffect(() => {
    if (!globalHighlightedTaskId && allVisibleTasks.length > 0) {
      setGlobalHighlightedTaskId(allVisibleTasks[0].task.id)
    }
  }, [allVisibleTasks.length]) // Only depend on length to avoid re-running

  // Track meta key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        setIsMetaKeyHeld(true)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsMetaKeyHeld(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Global keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't handle if we're editing
    if (listViewState.editingTaskId) return

    const currentIndex = allVisibleTasks.findIndex(t => t.task.id === globalHighlightedTaskId)
    
    // Navigation
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      const nextIndex = currentIndex < allVisibleTasks.length - 1 ? currentIndex + 1 : 0
      setGlobalHighlightedTaskId(allVisibleTasks[nextIndex]?.task.id || null)
      
      // Scroll into view
      const element = document.getElementById(`task-${allVisibleTasks[nextIndex]?.task.id}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : allVisibleTasks.length - 1
      setGlobalHighlightedTaskId(allVisibleTasks[prevIndex]?.task.id || null)
      
      // Scroll into view
      const element = document.getElementById(`task-${allVisibleTasks[prevIndex]?.task.id}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    
    // Other shortcuts that need the highlighted task
    const highlightedTask = allVisibleTasks.find(t => t.task.id === globalHighlightedTaskId)?.task
    if (highlightedTask) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          onTaskProcess(highlightedTask.id)
          break
        case '#':
          e.preventDefault()
          onOpenProjectOverlay(highlightedTask.id)
          break
        case '@':
          e.preventDefault()
          onOpenLabelOverlay(highlightedTask.id)
          break
        case 's':
        case 'S':
          e.preventDefault()
          onOpenScheduledOverlay(highlightedTask.id)
          break
        case 'd':
        case 'D':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            onOpenDeadlineOverlay(highlightedTask.id)
          }
          break
        case 'p':
        case 'P':
          if (!e.shiftKey) {
            e.preventDefault()
            onOpenPriorityOverlay(highlightedTask.id)
          }
          break
        case '+':
          e.preventDefault()
          onOpenAssigneeOverlay(highlightedTask.id)
          break
        case 'c':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            onTaskComplete(highlightedTask.id)
          }
          break
        case 'e':
          e.preventDefault()
          onListViewStateChange({
            ...listViewState,
            editingTaskId: highlightedTask.id
          })
          break
      }
    }
    
    // View mode switch
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault()
      onViewModeChange('processing')
    }
  }, [allVisibleTasks, globalHighlightedTaskId, listViewState, onListViewStateChange, 
      onTaskProcess, onTaskComplete, onOpenProjectOverlay, onOpenPriorityOverlay, 
      onOpenLabelOverlay, onOpenScheduledOverlay, onOpenDeadlineOverlay, 
      onOpenAssigneeOverlay, onViewModeChange])

  // Create list-specific view state with global highlight
  const getListViewState = useCallback((listId: string): ListViewState => {
    return {
      ...listViewState,
      highlightedTaskId: globalHighlightedTaskId,
      sortBy: listViewState.sortBy
    }
  }, [listViewState, globalHighlightedTaskId])

  // Handle list view state changes (intercept highlight changes)
  const handleListViewStateChange = useCallback((newState: ListViewState) => {
    // If highlight changed, update global highlight
    if (newState.highlightedTaskId !== listViewState.highlightedTaskId) {
      setGlobalHighlightedTaskId(newState.highlightedTaskId)
    }
    // Pass through other state changes
    onListViewStateChange({
      ...newState,
      highlightedTaskId: listViewState.highlightedTaskId // Keep original highlight in parent state
    })
  }, [listViewState, onListViewStateChange])

  // Create list-specific processing mode
  const getListProcessingMode = useCallback((list: ListData): ProcessingMode => {
    return {
      type: list.filterType as any,
      value: list.filterValue,
      displayName: list.label
    }
  }, [])

  // Load more handler
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 3, listData.length))
  }, [listData.length])

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="space-y-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {visibleLists.map((list, index) => (
        <div key={list.id} className="relative">
          <ListView
            tasks={list.tasks}
            projects={projects}
            labels={labels}
            processingMode={getListProcessingMode(list)}
            projectMetadata={projectMetadata}
            listViewState={getListViewState(list.id)}
            slidingOutTaskIds={slidingOutTaskIds}
            autoFocus={false}
            onListViewStateChange={handleListViewStateChange}
            onTaskUpdate={onTaskUpdate}
            onTaskComplete={onTaskComplete}
            onTaskProcess={onTaskProcess}
            onTaskDelete={onTaskDelete}
            onViewModeChange={onViewModeChange}
            currentUserId={currentUserId}
            collaborators={collaborators}
            onOpenProjectOverlay={onOpenProjectOverlay}
            onOpenPriorityOverlay={onOpenPriorityOverlay}
            onOpenLabelOverlay={onOpenLabelOverlay}
            onOpenScheduledOverlay={onOpenScheduledOverlay}
            onOpenDeadlineOverlay={onOpenDeadlineOverlay}
            onOpenAssigneeOverlay={onOpenAssigneeOverlay}
          />
        </div>
      ))}
      
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Load More Lists ({listData.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}

export default MultiListContainer