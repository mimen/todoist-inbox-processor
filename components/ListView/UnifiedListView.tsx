'use client'

import React, { useMemo, useCallback, memo, useEffect, useRef, useState } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, TaskUpdate, TodoistUser } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'
import { ListViewState, getDisplayContext } from '@/types/view-mode'
import { filterTasksByMode } from '@/lib/task-filters'
import { AssigneeFilterType } from '@/components/AssigneeFilter'
import { useQueueConfig } from '@/hooks/useQueueConfig'
import { usePrioritizedOptions } from '@/hooks/usePrioritizedOptions'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { useListViewIntegration } from '@/hooks/useListViewIntegration'
import { useOverlayManager } from '@/hooks/useOverlayManager'
import TaskListItem from './TaskListItem'
import ListHeader from './ListHeader'
import MultiListHeader from './MultiListHeader'

export interface UnifiedListViewProps {
  // Data
  allTasks: TodoistTask[]
  masterTasks?: Record<string, TodoistTask>
  projects: TodoistProject[]
  labels: TodoistLabel[]
  
  // Mode Configuration
  viewMode: 'single' | 'multi'
  processingMode: ProcessingMode
  
  // Multi-list Configuration (when viewMode === 'multi')
  prioritizedSequence?: any[] // QueueOption[]
  visibleListCount?: number
  
  // Settings
  settings?: any // ListViewSettings
  
  // State & Handlers
  listViewState: ListViewState
  slidingOutTaskIds: string[]
  onListViewStateChange: (state: ListViewState) => void
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  onTaskComplete: (taskId: string) => void
  onTaskProcess: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
  onViewModeChange: (mode: 'processing') => void
  
  // Additional props
  currentUserId: string
  projectMetadata: Record<string, any>
  assigneeFilter?: AssigneeFilterType
  collaborators?: Record<string, TodoistUser[]>
  autoFocus?: boolean
  
  // Overlay handlers
  onOpenProjectOverlay: (taskId: string) => void
  onOpenPriorityOverlay: (taskId: string) => void
  onOpenLabelOverlay: (taskId: string) => void
  onOpenScheduledOverlay: (taskId: string) => void
  onOpenDeadlineOverlay: (taskId: string) => void
  onOpenAssigneeOverlay: (taskId: string) => void
  onOpenCompleteOverlay: (taskId: string) => void
}

interface ListData {
  id: string
  label: string
  icon?: React.ReactNode
  tasks: TodoistTask[]
  filterType: string
  filterValue: string | string[]
  processingMode: ProcessingMode
}

interface UnifiedListViewState {
  // Global state
  highlightedTaskId: string | null
  selectedTaskIds: Set<string>
  editingTaskId: string | null
  
  // Per-list state (keyed by list ID)
  listStates: Map<string, {
    sortBy: string
    isCollapsed: boolean
    scrollPosition: number
  }>
  
  // Multi-list specific
  visibleListCount: number
  loadedLists: Set<string>
}

/**
 * Unified List View Component
 * Handles both single and multi-list modes internally
 * Eliminates synchronization issues by being the single source of truth
 */
const UnifiedListView: React.FC<UnifiedListViewProps> = ({
  allTasks,
  masterTasks,
  projects,
  labels,
  viewMode,
  processingMode,
  prioritizedSequence,
  visibleListCount: initialVisibleCount = 3,
  settings: externalSettings,
  listViewState,
  slidingOutTaskIds,
  onListViewStateChange,
  onTaskUpdate,
  onTaskComplete,
  onTaskProcess,
  onTaskDelete,
  onViewModeChange,
  currentUserId,
  projectMetadata,
  assigneeFilter = 'all',
  collaborators = {},
  autoFocus = true,
  onOpenProjectOverlay,
  onOpenPriorityOverlay,
  onOpenLabelOverlay,
  onOpenScheduledOverlay,
  onOpenDeadlineOverlay,
  onOpenAssigneeOverlay,
  onOpenCompleteOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMetaKeyHeld, setIsMetaKeyHeld] = useState(false)
  const isKeyboardNavigating = useRef(false)
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount)
  
  const config = useQueueConfig()
  const { settings } = useSettingsContext()
  const effectiveSettings = externalSettings || settings
  const { isAnyOverlayOpen } = useOverlayManager()
  
  // Get prioritized options for multi-list mode
  const prioritizedOptions = usePrioritizedOptions(
    allTasks,
    prioritizedSequence || config.prioritizedQueue?.sequence || [],
    projectMetadata,
    projects
  )
  

  // Create comprehensive task lookup for focused task integration
  const allTasksLookup = useMemo(() => {
    const lookup: Record<string, TodoistTask> = {}
    allTasks.forEach(task => {
      lookup[task.id] = task
    })
    return lookup
  }, [allTasks])

  // Integrate with focused task context
  useListViewIntegration({
    highlightedTaskId: listViewState.highlightedTaskId,
    tasks: allTasksLookup,
    processingMode,
    viewMode: 'list'
  })

  // Create project lookup map
  const projectMap = useMemo(() => {
    const map: Record<string, TodoistProject> = {}
    projects.forEach(project => {
      map[project.id] = project
    })
    return map
  }, [projects])

  // Build list data based on mode
  const listData = useMemo((): ListData[] => {
    if (viewMode === 'single') {
      // Single list mode - just one list with current processing mode
      const tasks = filterTasksByMode(
        allTasks,
        processingMode,
        projectMetadata,
        assigneeFilter,
        currentUserId
      )
      
      return [{
        id: 'single',
        label: processingMode.displayName || 'All Tasks',
        icon: undefined,
        tasks,
        filterType: processingMode.type,
        filterValue: processingMode.value,
        processingMode
      }]
    }
    
    // Multi-list mode - build from prioritized options
    const shownTaskIds = effectiveSettings?.listView?.duplicateFiltering ? new Set<string>() : null
    
    const rawLists = prioritizedOptions.map((option, index) => {
      // Parse the filter details from the option
      let filterType = option.type || 'project'
      let filterValue = option.id
      
      // Special handling for inbox project
      if (option.id === 'inbox') {
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
        assigneeFilter,
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
        id: `list-${index}`,
        label: option.label,
        icon: option.icon,
        tasks,
        filterType,
        filterValue,
        processingMode: listProcessingMode
      }
    })
    
    
    // In multi-list mode, we want to show lists even if they're empty
    // to ensure we always have the configured number of lists visible
    if (viewMode === 'multi') {
      return rawLists
    }
    
    // In single-list mode, filter out empty lists
    const filteredLists = rawLists.filter(list => list.tasks.length > 0)
    return filteredLists
  }, [viewMode, allTasks, processingMode, prioritizedOptions, projectMetadata, assigneeFilter, currentUserId, effectiveSettings, projects])


  // Get visible lists
  const visibleLists = viewMode === 'single' ? listData : listData.slice(0, visibleCount)
  const hasMore = viewMode === 'multi' && visibleCount < listData.length

  // Create a flat array of all visible tasks for navigation
  const allVisibleTasks = useMemo(() => {
    const tasks: { task: TodoistTask; listId: string; listIndex: number }[] = []
    visibleLists.forEach((list, listIndex) => {
      // Sort tasks within each list based on list-specific sort
      const listState = listViewState as any // We'll type this properly later
      const sortBy = listState?.listStates?.get(list.id)?.sortBy || listViewState.sortBy || 'default'
      
      const sortedTasks = [...list.tasks]
      
      switch (sortBy) {
        case 'priority':
          sortedTasks.sort((a, b) => {
            if (b.priority !== a.priority) {
              return b.priority - a.priority // P1 (4) first
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })
          break
        
        case 'dueDate':
          sortedTasks.sort((a, b) => {
            if (!a.due && !b.due) return 0
            if (!a.due) return 1
            if (!b.due) return -1
            
            const dateA = new Date(a.due.date)
            const dateB = new Date(b.due.date)
            return dateA.getTime() - dateB.getTime()
          })
          break
        
        case 'createdAt':
          sortedTasks.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          break
        
        case 'alphabetical':
          sortedTasks.sort((a, b) => 
            a.content.toLowerCase().localeCompare(b.content.toLowerCase())
          )
          break
        
        default:
          // Keep original order
      }
      
      sortedTasks.forEach(task => {
        tasks.push({ task, listId: list.id, listIndex })
      })
    })
    
    
    return tasks
  }, [visibleLists, listViewState])

  // Ensure we always have a highlighted task when in list view
  useEffect(() => {
    if (allVisibleTasks.length > 0) {
      // Check if current highlighted task still exists
      const currentHighlightedTask = allVisibleTasks.find(t => t.task.id === listViewState.highlightedTaskId)
      
      if (!currentHighlightedTask) {
        // Highlighted task was removed (completed/deleted), find a replacement
        // Try to maintain position by finding the task at the same index
        const lastHighlightedIndex = allVisibleTasks.findIndex(t => t.task.id === listViewState.highlightedTaskId)
        const newIndex = Math.min(Math.max(0, lastHighlightedIndex), allVisibleTasks.length - 1)
        
        // Prefer tasks from Inbox if we're selecting a new task
        const inboxTask = allVisibleTasks.find(t => t.listIndex === 0)
        const targetTask = (newIndex === 0 && inboxTask) ? inboxTask.task : allVisibleTasks[newIndex].task
        
        
        onListViewStateChange({
          ...listViewState,
          highlightedTaskId: targetTask.id
        })
      }
    } else if (allVisibleTasks.length === 0) {
      // No tasks available, clear the highlight
      if (listViewState.highlightedTaskId) {
        onListViewStateChange({
          ...listViewState,
          highlightedTaskId: null
        })
      }
    }
  }, [allVisibleTasks, listViewState, onListViewStateChange])
  
  // Handle keyboard navigation - single handler for all lists
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const highlightedTaskInfo = allVisibleTasks.find(t => t.task.id === listViewState.highlightedTaskId)
    const highlightedTask = highlightedTaskInfo?.task
    
    // If we're editing, only handle Escape to cancel editing
    if (listViewState.editingTaskId) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onListViewStateChange({
          ...listViewState,
          editingTaskId: null
        })
      }
      // Don't process any other keys while editing
      return
    }
    
    // List View specific shortcuts
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault()
      onViewModeChange('processing')
      return
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault()
      // Select all visible tasks
      const allTaskIds = new Set(allVisibleTasks.map(t => t.task.id))
      onListViewStateChange({
        ...listViewState,
        selectedTaskIds: allTaskIds
      })
      return
    }
    
    if (e.key === 'Escape' && listViewState.selectedTaskIds.size > 0) {
      e.preventDefault()
      // Clear selection
      onListViewStateChange({
        ...listViewState,
        selectedTaskIds: new Set()
      })
      return
    }
    
    if (e.key === 'Enter' && highlightedTask) {
      e.preventDefault()
      // Switch to processing view with this task
      onTaskProcess(highlightedTask.id)
      return
    }
    
    // Navigation across all lists
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      const currentIndex = allVisibleTasks.findIndex(t => t.task.id === listViewState.highlightedTaskId)
      const nextIndex = currentIndex < allVisibleTasks.length - 1 ? currentIndex + 1 : 0
      isKeyboardNavigating.current = true
      onListViewStateChange({
        ...listViewState,
        highlightedTaskId: allVisibleTasks[nextIndex]?.task.id || null
      })
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      const currentIndex = allVisibleTasks.findIndex(t => t.task.id === listViewState.highlightedTaskId)
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : allVisibleTasks.length - 1
      isKeyboardNavigating.current = true
      onListViewStateChange({
        ...listViewState,
        highlightedTaskId: allVisibleTasks[prevIndex]?.task.id || null
      })
    }
    
    // Task actions on highlighted task
    if (highlightedTask) {
      switch (e.key) {
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
            if (e.metaKey || e.ctrlKey) {
              // Cmd+P or Ctrl+P for priority overlay
              e.preventDefault()
              onOpenPriorityOverlay(highlightedTask.id)
            } else if (!e.metaKey && !e.ctrlKey) {
              // Regular P key
              e.preventDefault()
              onOpenPriorityOverlay(highlightedTask.id)
            }
          }
          break
          
        case 'a':
        case 'A':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            onOpenAssigneeOverlay(highlightedTask.id)
          }
          break
          
        case 'c':
        case 'C':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            onOpenCompleteOverlay(highlightedTask.id)
          }
          break
          
        case 'Delete':
        case 'Backspace':
          if (e.shiftKey || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault()
            onTaskDelete(highlightedTask.id)
          }
          break
          
        case 'e':
        case 'E':
          e.preventDefault()
          onListViewStateChange({
            ...listViewState,
            editingTaskId: highlightedTask.id
          })
          break
          
        case ' ':
          if (!e.shiftKey) {
            e.preventDefault()
            const newSelectedIds = new Set(listViewState.selectedTaskIds)
            if (newSelectedIds.has(highlightedTask.id)) {
              newSelectedIds.delete(highlightedTask.id)
            } else {
              newSelectedIds.add(highlightedTask.id)
            }
            onListViewStateChange({
              ...listViewState,
              selectedTaskIds: newSelectedIds
            })
          }
          break
      }
    }
  }, [allVisibleTasks, listViewState, onListViewStateChange, onViewModeChange, onTaskProcess, 
      onTaskComplete, onTaskDelete, onOpenProjectOverlay, onOpenPriorityOverlay, 
      onOpenLabelOverlay, onOpenScheduledOverlay, onOpenDeadlineOverlay, onOpenAssigneeOverlay, onOpenCompleteOverlay])

  // Ensure keyboard events work even without browser focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when:
      // 1. Not editing a task
      // 2. No overlay is open
      // 3. Not typing in an input/textarea
      if (!listViewState.editingTaskId && 
          !isAnyOverlayOpen &&
          !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        // Convert to React keyboard event and call our handler
        handleKeyDown(e as any)
      }
    }

    // Listen globally so we don't need browser focus
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [listViewState.editingTaskId, isAnyOverlayOpen, handleKeyDown])

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

  // Scroll highlighted task into view ONLY when using keyboard navigation
  useEffect(() => {
    if (listViewState.highlightedTaskId && isKeyboardNavigating.current) {
      const element = document.getElementById(`task-${listViewState.highlightedTaskId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
      // Reset the flag after scrolling
      isKeyboardNavigating.current = false
    }
  }, [listViewState.highlightedTaskId])

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 1, listData.length))
  }, [listData.length])

  // Ref for the load more button
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-load more lists when button comes into view
  useEffect(() => {
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before button is visible
        threshold: 0.1, // Trigger when 10% of the button is visible
      }
    )

    const button = loadMoreButtonRef.current
    if (button) {
      observer.observe(button)
      
      // Check if button is already in view on mount
      // Small delay to ensure proper layout calculation
      setTimeout(() => {
        const rect = button.getBoundingClientRect()
        const inView = rect.top < window.innerHeight + 100 && rect.bottom > 0
        if (inView) {
          handleLoadMore()
        }
      }, 100)
    }

    return () => {
      if (button) {
        observer.unobserve(button)
      }
    }
  }, [hasMore, handleLoadMore])

  // Handle task click
  const handleTaskClick = useCallback((taskId: string) => {
    if (isMetaKeyHeld) {
      // Multi-select with Cmd/Ctrl+Click
      const newSelectedIds = new Set(listViewState.selectedTaskIds)
      if (newSelectedIds.has(taskId)) {
        newSelectedIds.delete(taskId)
      } else {
        newSelectedIds.add(taskId)
      }
      onListViewStateChange({
        ...listViewState,
        selectedTaskIds: newSelectedIds
      })
    } else {
      // Regular click - just highlight
      onListViewStateChange({
        ...listViewState,
        highlightedTaskId: taskId
      })
    }
  }, [isMetaKeyHeld, listViewState, onListViewStateChange])

  // Render a single list
  const renderList = (list: ListData, _listIndex: number) => {
    const displayContext = getDisplayContext(list.processingMode)
    const listTasks = allVisibleTasks
      .filter(t => t.listId === list.id)
      .map(t => t.task)
    
    return (
      <div key={list.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {viewMode === 'multi' ? (
          <MultiListHeader
            processingMode={list.processingMode}
            taskCount={list.tasks.length}
            icon={typeof list.icon === 'string' ? list.icon : undefined}
            color={list.filterType === 'project' && typeof list.filterValue === 'string' ? projectMap[list.filterValue]?.color : undefined}
          />
        ) : (
          <ListHeader
            processingMode={list.processingMode}
            taskCount={list.tasks.length}
            sortBy={listViewState.sortBy}
            onSortChange={(sortBy) => {
              onListViewStateChange({
                ...listViewState,
                sortBy
              })
            }}
          />
        )}
        
        <div className="space-y-1">
          {listTasks.map((task) => {
            const taskLabels = labels?.filter(label => task.labels?.includes(label.name)) || []
            const isSlidingOut = slidingOutTaskIds?.includes(task.id) || false
            
            return (
              <div
                key={task.id}
                className={isSlidingOut ? 'animate-fade-out-task mb-0' : 'mb-0'}
              >
                <TaskListItem
                  task={task}
                  project={projectMap[task.projectId]}
                  labels={taskLabels}
                  displayContext={displayContext}
                  isExpanded={listViewState.expandedDescriptions.has(task.id)}
                  isSelected={listViewState.selectedTaskIds.has(task.id)}
                  isHighlighted={listViewState.highlightedTaskId === task.id}
                  isEditing={listViewState.editingTaskId === task.id}
                  showSelectionCheckbox={isMetaKeyHeld || listViewState.selectedTaskIds.size > 0}
                  onToggleExpand={() => {
                    const newExpanded = new Set(listViewState.expandedDescriptions)
                    if (newExpanded.has(task.id)) {
                      newExpanded.delete(task.id)
                    } else {
                      newExpanded.add(task.id)
                    }
                    onListViewStateChange({ ...listViewState, expandedDescriptions: newExpanded })
                  }}
                  onToggleSelect={() => {
                    const newSelected = new Set(listViewState.selectedTaskIds)
                    if (newSelected.has(task.id)) {
                      newSelected.delete(task.id)
                    } else {
                      newSelected.add(task.id)
                    }
                    onListViewStateChange({ ...listViewState, selectedTaskIds: newSelected })
                  }}
                  onEdit={() => {
                    // Toggle edit mode - if already editing this task, exit edit mode
                    onListViewStateChange({
                      ...listViewState,
                      editingTaskId: listViewState.editingTaskId === task.id ? null : task.id
                    })
                  }}
                  onUpdate={onTaskUpdate}
                  onComplete={() => onTaskComplete(task.id)}
                  onProcess={() => onTaskProcess(task.id)}
                  onDelete={() => onTaskDelete(task.id)}
                  onClick={() => {
                    if (!listViewState.editingTaskId) {
                      handleTaskClick(task.id)
                    }
                  }}
                  onOpenProjectOverlay={() => onOpenProjectOverlay(task.id)}
                  onOpenPriorityOverlay={() => onOpenPriorityOverlay(task.id)}
                  onOpenLabelOverlay={() => onOpenLabelOverlay(task.id)}
                  onOpenScheduledOverlay={() => onOpenScheduledOverlay(task.id)}
                  onOpenDeadlineOverlay={() => onOpenDeadlineOverlay(task.id)}
                  onOpenAssigneeOverlay={() => onOpenAssigneeOverlay(task.id)}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      data-list-view-container
      className={viewMode === 'multi' ? "space-y-4" : "flex-1 overflow-y-auto px-3 py-1"}
    >
      {visibleLists.map((list, index) => renderList(list, index))}
      
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            ref={loadMoreButtonRef}
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Load More ({listData.length - visibleCount} more {listData.length - visibleCount === 1 ? 'list' : 'lists'})
          </button>
        </div>
      )}
      
      {visibleLists.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks to display
        </div>
      )}
    </div>
  )
}

export default UnifiedListView