'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
  icon?: string
  tasks: TodoistTask[]
  filterType: string
  filterValue: string
  isLoaded: boolean
}

/**
 * Multi-List Container Component
 * Displays multiple task lists sequentially with progressive loading
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
  const listRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [loadedLists, setLoadedLists] = useState<Set<string>>(new Set(['0', '1', '2', '3', '4', '5'])) // Load first 6 lists immediately
  const config = useQueueConfig()
  const { settings } = useSettingsContext()

  // Use the allTasks prop directly - it contains ALL tasks from the API
  // masterTasks only contains tasks that have been loaded for specific modes

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
        id: `${index}`,
        label: option.label,
        icon: option.icon,
        tasks,
        filterType,
        filterValue,
        isLoaded: loadedLists.has(`${index}`)
      }
    })
    
    // Apply filtering
    const filteredLists = rawLists.filter(list => {
      const shouldShow = list.tasks.length > 0 || config.behavior?.showEmptyQueues
      return shouldShow
    })
    
    
    return filteredLists
  }, [prioritizedOptions, allTasks, projectMetadata, currentUserId, assigneeFilter, loadedLists, config, settings.listView.duplicateFiltering])

  // Set up intersection observer for progressive loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const listId = entry.target.getAttribute('data-list-id')
            if (listId && !loadedLists.has(listId)) {
              setLoadedLists(prev => new Set([...prev, listId]))
            }
          }
        })
      },
      {
        rootMargin: '100px' // Start loading 100px before the element comes into view
      }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [loadedLists])

  // Observe list placeholders
  useEffect(() => {
    const observer = observerRef.current
    if (!observer) return

    listRefs.current.forEach((element, id) => {
      if (!loadedLists.has(id)) {
        observer.observe(element)
      }
    })

    return () => {
      listRefs.current.forEach(element => {
        observer?.unobserve(element)
      })
    }
  }, [listData, loadedLists])

  // Create list-specific view state
  const getListViewState = useCallback((listId: string): ListViewState => {
    return {
      ...listViewState,
      // Each list maintains its own sort preference
      sortBy: listViewState.sortBy // For now, use global sort
    }
  }, [listViewState])

  // Create list-specific processing mode
  const getListProcessingMode = useCallback((list: ListData): ProcessingMode => {
    return {
      type: list.filterType as any,
      value: list.filterValue,
      displayName: list.label
    }
  }, [])


  return (
    <div ref={containerRef} className="space-y-6">
      {listData.map((list, index) => {
        const isLoaded = list.isLoaded

        return (
          <div
            key={list.id}
            ref={(el) => {
              if (el) listRefs.current.set(list.id, el)
              else listRefs.current.delete(list.id)
            }}
            data-list-id={list.id}
            className="relative"
          >
            {isLoaded ? (
              <div className="animate-fade-in">
                <ListView
                  tasks={list.tasks}
                  projects={projects}
                  labels={labels}
                  processingMode={getListProcessingMode(list)}
                  projectMetadata={projectMetadata}
                  listViewState={getListViewState(list.id)}
                  slidingOutTaskIds={slidingOutTaskIds}
                  onListViewStateChange={onListViewStateChange}
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
            ) : (
              // Placeholder for unloaded lists
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {list.icon && <span>{list.icon}</span>}
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{list.label}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({list.tasks.length})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="py-8 text-center text-gray-400">
                  <div className="animate-pulse">Loading...</div>
                </div>
              </div>
            )}

            {/* Separator between lists */}
            {index < listData.length - 1 && (
              <div className="mt-6" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MultiListContainer