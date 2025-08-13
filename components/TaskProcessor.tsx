'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TodoistTask, TodoistProject, TodoistLabel, ProcessingState, TaskUpdate, TodoistUser, CollaboratorsData } from '@/lib/types'
import { generateMockSuggestions } from '@/lib/mock-data'
import { suggestionsCache } from '@/lib/suggestions-cache'
import { ProcessingMode, PROCESSING_MODE_OPTIONS } from '@/types/processing-mode'
import { ViewMode, ListViewState, createDefaultListViewState } from '@/types/view-mode'
import { filterTasksByMode, getTaskCountsForProjects } from '@/lib/task-filters'
import { isExcludedLabel } from '@/lib/excluded-labels'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useOverlayManager, OverlayType } from '@/hooks/useOverlayManager'
import { useTaskKeyboardShortcuts } from '@/hooks/useTaskKeyboardShortcuts'
import OverlayManager from './OverlayManager'

// Extract project metadata from special tasks marked with * prefix or project-metadata label
function extractProjectMetadata(tasks: TodoistTask[]): Record<string, any> {
  const metadata: Record<string, any> = {}
  
  tasks.forEach(task => {
    // Look for project-metadata tasks (these contain project priority and due date)
    if (task.labels.includes('project-metadata') || task.content.startsWith('* ')) {
      const projectId = task.projectId
      if (!metadata[projectId]) {
        metadata[projectId] = {}
      }
      
      // The task's priority IS the project's priority
      // Todoist uses: P1=4, P2=3, P3=2, P4=1
      if (task.priority) {
        metadata[projectId].priority = task.priority
      }
      
      // The task's scheduled date IS the project's scheduled date
      if (task.due) {
        metadata[projectId].due = task.due
      }
      
      // Store the task description if available
      if (task.description) {
        metadata[projectId].description = task.description
      }
    }
  })
  
  return metadata
}
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import KeyboardShortcuts from './KeyboardShortcuts'
import ProgressIndicator from './ProgressIndicator'
import ProcessingModeSelector, { ProcessingModeSelectorRef } from './ProcessingModeSelector'
import ProjectSuggestions from './ProjectSuggestions'
import Toast from './Toast'
import ProjectMetadataDisplay from './ProjectMetadataDisplay'
import AssigneeFilter, { AssigneeFilterType } from './AssigneeFilter'
import QueueCompletionView from './QueueCompletionView'
import ViewModeToggle from './ViewModeToggle'
import { UnifiedListView } from './ListView'
import SyncStatus from './SyncStatus'
import { useSettingsContext } from '@/contexts/SettingsContext'
import SettingsButton from './SettingsButton'
import SettingsModal from './SettingsModal'
import MultiListModeIndicator from './MultiListModeIndicator'
import DebugInfo from './DebugInfo'

export default function TaskProcessor() {
  const searchParams = useSearchParams()
  const isDebugMode = searchParams.get('debug') === 'true'
  const [showDebug, setShowDebug] = useState(false)
  
  // Ref for ProcessingModeSelector
  const processingModeSelectorRef = useRef<ProcessingModeSelectorRef>(null)
  
  // MAIN STATE
  const [projects, setProjects] = useState<TodoistProject[]>([])
  const [labels, setLabels] = useState<TodoistLabel[]>([])
  const [filters, setFilters] = useState<any[]>([])
  const [projectHierarchy, setProjectHierarchy] = useState<any>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingMode, setProcessingMode] = useState<ProcessingMode>({
    type: 'project',
    value: '',
    displayName: 'Inbox'
  })
  const [allTasksGlobal, setAllTasksGlobal] = useState<TodoistTask[]>([]) // All tasks from API
  const [taskKey, setTaskKey] = useState(0) // Force re-render of TaskForm
  const [projectMetadata, setProjectMetadata] = useState<Record<string, any>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentTaskSuggestions, setCurrentTaskSuggestions] = useState<any[]>([])
  const [collaboratorsData, setCollaboratorsData] = useState<CollaboratorsData | null>(null)
  const [currentTaskAssignee, setCurrentTaskAssignee] = useState<TodoistUser | undefined>(undefined)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterType>('not-assigned-to-others')
  const [projectCollaborators, setProjectCollaborators] = useState<Record<string, TodoistUser[]>>({})
  const [dateLoadingStates, setDateLoadingStates] = useState<Record<string, 'due' | 'deadline' | null>>({})
  
  // Settings state
  const { settings } = useSettingsContext()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  // Removed showNextQueuePrompt as it's now integrated into empty state
  
  // Focused task and overlay management
  const { setFocusedTask } = useFocusedTask()
  const { openOverlay, closeOverlay, focusedTask } = useOverlayManager()
  
  // VIEW MODE STATE (for List View feature)
  // Initialize from localStorage with SSR safety
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'processing'
    try {
      const saved = localStorage.getItem('todoist-view-mode')
      return (saved === 'list' || saved === 'processing') ? saved : 'processing'
    } catch {
      return 'processing'
    }
  })
  
  // List view specific state
  const [listViewState, setListViewState] = useState<ListViewState>(createDefaultListViewState)
  
  // Sync view mode to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('todoist-view-mode', viewMode)
      } catch (error) {
        console.error('Failed to save view mode preference:', error)
      }
    }
  }, [viewMode])
  
  // NEW QUEUE ARCHITECTURE STATE
  // 1. Master task store - continuously updated as changes are made
  const [masterTasks, setMasterTasks] = useState<Record<string, TodoistTask>>({})
  
  // 2. Current queue - stable until explicit reload  
  const [taskQueue, setTaskQueue] = useState<string[]>([])
  
  // 3. Position tracking
  const [queuePosition, setQueuePosition] = useState(0)
  const [processedTaskIds, setProcessedTaskIds] = useState<string[]>([])
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([])
  const [slidingOutTaskIds, setSlidingOutTaskIds] = useState<string[]>([])
  
  const currentUserId = collaboratorsData?.currentUser?.id || '13801296' // Use dynamic user ID
  
  // DERIVED STATE from queue architecture
  // Active queue - only unprocessed tasks
  const activeQueue = useMemo(() => {
    return taskQueue.filter(taskId => !processedTaskIds.includes(taskId))
  }, [taskQueue, processedTaskIds])
  
  // Current position in active queue
  const [activeQueuePosition, setActiveQueuePosition] = useState(0)
  
  const currentTask = useMemo((): TodoistTask | null => {
    if (activeQueuePosition >= activeQueue.length) return null
    const taskId = activeQueue[activeQueuePosition]
    return masterTasks[taskId] || null
  }, [activeQueue, activeQueuePosition, masterTasks])
  
  
  
  const queuedTasks = useMemo((): TodoistTask[] => {
    return activeQueue.slice(activeQueuePosition + 1)
      .map(id => masterTasks[id])
      .filter(Boolean)
  }, [activeQueue, activeQueuePosition, masterTasks])
  
  const totalTasks = taskQueue.length
  const completedTasks = processedTaskIds.length
  
  // Helper function to check if current project has collaborators
  const hasCollaboratorsForCurrentProject = useCallback(() => {
    if (!currentTask) return false
    const projectId = currentTask.projectId
    
    // Check if we have collaborator data for this project
    const projectCollabs = projectCollaborators[projectId]
    if (projectCollabs && projectCollabs.length > 0) {
      return true
    }
    
    // Check sync data
    if (collaboratorsData?.projectCollaborators[projectId]) {
      const collabIds = collaboratorsData.projectCollaborators[projectId]
      // More than just the current user means there are other collaborators
      return collabIds.length > 1 || (collabIds.length === 1 && collabIds[0] !== currentUserId)
    }
    
    return false
  }, [currentTask, projectCollaborators, collaboratorsData, currentUserId])
  
  // Apply global filters (archived, excluded labels, assignee) to all tasks
  const globallyFilteredTasks = useMemo(() => {
    let filtered = allTasksGlobal
    
    // 1. Exclude completed tasks
    filtered = filtered.filter(task => !task.isCompleted)
    
    // 2. Exclude archived tasks (starting with *)
    filtered = filtered.filter(task => !task.content.startsWith('* '))
    
    // 3. Exclude tasks with excluded labels
    filtered = filtered.filter(task => 
      !task.labels.some(label => isExcludedLabel(label))
    )
    
    // 4. Apply assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => {
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
      })
    }
    
    return filtered
  }, [allTasksGlobal, assigneeFilter, currentUserId])
  
  // Ensure all globally filtered tasks are in master store when in list view
  useEffect(() => {
    if (viewMode === 'list' && globallyFilteredTasks.length > 0) {
      setMasterTasks(prev => {
        const newMasterTasks = { ...prev }
        
        // Add any tasks that aren't already in the master store
        globallyFilteredTasks.forEach(task => {
          if (!newMasterTasks[task.id]) {
            newMasterTasks[task.id] = task
          }
        })
        
        return newMasterTasks
      })
    }
  }, [viewMode, globallyFilteredTasks])
  
  // Helper functions for updating list view state
  const updateListViewState = useCallback((updates: Partial<ListViewState>) => {
    setListViewState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const toggleExpandedDescription = useCallback((taskId: string) => {
    setListViewState(prev => {
      const newExpanded = new Set(prev.expandedDescriptions)
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId)
      } else {
        newExpanded.add(taskId)
      }
      return { ...prev, expandedDescriptions: newExpanded }
    })
  }, [])
  
  const toggleSelectedTask = useCallback((taskId: string) => {
    setListViewState(prev => {
      const newSelected = new Set(prev.selectedTaskIds)
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId)
      } else {
        newSelected.add(taskId)
      }
      return { ...prev, selectedTaskIds: newSelected }
    })
  }, [])

  // Load initial data (projects and labels)
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch critical data first (projects, labels, filters, and collaborators)
        // Use sync API for projects to ensure consistent IDs with tasks
        const [projectsRes, labelsRes, filtersRes, collaboratorsRes] = await Promise.all([
          fetch('/api/todoist/projects-sync'),
          fetch('/api/todoist/labels'),
          fetch('/api/todoist/filters'),
          fetch('/api/todoist/collaborators-sync'),
        ])

        if (!projectsRes.ok || !labelsRes.ok) {
          throw new Error('Failed to fetch data from Todoist API')
        }

        const [projectsResponse, labelsData, filtersData, collaboratorsData] = await Promise.all([
          projectsRes.json(),
          labelsRes.json(),
          filtersRes.ok ? filtersRes.json() : [],
          collaboratorsRes.ok ? collaboratorsRes.json() : null,
        ])
        
        // Extract projects from response
        const projectsData = projectsResponse.projects || projectsResponse

        setProjects(projectsData)
        setLabels(labelsData)
        setFilters(filtersData)
        
        // Set collaborators data and pre-populate project collaborators
        if (collaboratorsData) {
          setCollaboratorsData(collaboratorsData)
          
          // Pre-populate projectCollaborators using the actual mapping from collaborator_states
          const initialProjectCollaborators: Record<string, TodoistUser[]> = {}
          
          // For each project, find the active collaborators
          Object.entries(collaboratorsData.projectCollaborators || {}).forEach(([projectId, userIds]) => {
            // Map user IDs to actual user objects
            const projectUsers = (userIds as string[])
              .map(userId => collaboratorsData.allUsers.find(user => user.id === userId))
              .filter(Boolean) as TodoistUser[]
            
            initialProjectCollaborators[projectId] = projectUsers
            // Store project collaborators
          })
          
          // For projects with no collaborators, set empty array
          projectsData.forEach((project: any) => {
            if (!(project.id in initialProjectCollaborators)) {
              initialProjectCollaborators[project.id] = []
            }
          })
          
          setProjectCollaborators(initialProjectCollaborators)
          // Collaborators initialized
        }
        
        
        // Set default to prioritized queue starting with inbox
        const inboxProject = projectsData.find((p: any) => p.isInboxProject)
        const inboxId = inboxProject?.id || 'inbox'
        
        // Create the prioritized value for inbox
        const prioritizedValue = {
          filterType: 'project',
          filterValue: inboxId,
          isPriorityProject: false
        }
        
        const initialMode = {
          type: 'prioritized' as const,
          value: JSON.stringify(prioritizedValue),
          displayName: 'Inbox'
        }
        
        
        setProcessingMode(initialMode)
        
        // Load ALL tasks immediately using sync API
        const allTasksRes = await fetch('/api/todoist/all-tasks')
        let metadata: Record<string, any> = {}
        
        if (allTasksRes.ok) {
          const data = await allTasksRes.json()
          setAllTasksGlobal(data.tasks)
          
          // Extract project metadata from special tasks
          metadata = extractProjectMetadata(data.tasks)
          setProjectMetadata(metadata)
          // Project metadata extracted
          
          // Debug: Log projects with P1 priority
          const p1Projects = Object.entries(metadata)
            .filter(([_, meta]) => meta.priority === 4)
            .map(([projectId, meta]) => ({ projectId, ...meta }))
          // P1 projects identified
          
          // Filter and display inbox tasks immediately
          if (inboxProject) {
            const inboxTasks = filterTasksByMode(data.tasks, {
              type: 'project',
              value: inboxProject.id,
              displayName: inboxProject.name
            }, metadata, assigneeFilter, currentUserId)
            
            // Initialize queue architecture with inbox tasks
            if (inboxTasks.length > 0) {
              const taskMap = inboxTasks.reduce((acc, task) => {
                acc[task.id] = task
                return acc
              }, {} as Record<string, TodoistTask>)
              
              setMasterTasks(taskMap)
              setTaskQueue(inboxTasks.map(task => task.id))
              setQueuePosition(0)
              setProcessedTaskIds([])
              setSkippedTaskIds([])
              setTaskKey(prev => prev + 1)
            }
            
          }
          
          // Build project hierarchy from already-loaded data
          const buildProjectHierarchy = (projectsList: any[], metadataObj: any) => {
            // Add metadata to projects
            const projectsWithMetadata = projectsList.map((project: any) => ({
              ...project,
              description: metadataObj[project.id]?.description || '',
              priority: metadataObj[project.id]?.priority || null,
              due: metadataObj[project.id]?.due || null,
            }))
            
            // Build hierarchy
            const rootProjects = projectsWithMetadata.filter((p: any) => !p.parentId)
            const childProjects = projectsWithMetadata.filter((p: any) => p.parentId)
            
            const hierarchical = rootProjects.map((parent: any) => ({
              ...parent,
              children: childProjects.filter((child: any) => child.parentId === parent.id)
            }))
            
            const hierarchyData = {
              projects: projectsWithMetadata,
              hierarchy: hierarchical,
              summary: {
                totalProjects: projectsWithMetadata.length,
                projectsWithDescriptions: projectsWithMetadata.filter((p: any) => p.description).length,
                rootProjects: rootProjects.length
              }
            }
            
            setProjectHierarchy(hierarchyData)
          }
          
          // Build hierarchy after metadata is extracted
          buildProjectHierarchy(projectsData, metadata)
          
          // Update projects state with enriched data
          const enrichedProjects = projectsData.map((project: any) => ({
            ...project,
            priority: metadata[project.id]?.priority || null
          }))
          setProjects(enrichedProjects)
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load tasks for selected mode - NEW QUEUE ARCHITECTURE
  const loadTasksForMode = useCallback(async (mode: ProcessingMode) => {
    if (!mode.value) return
    
    setLoadingTasks(true)
    
    try {
      let filteredTasks: TodoistTask[] = []
      
      // For filter mode, fetch tasks from API
      if (mode.type === 'filter') {
        const filterQuery = mode.value.toString().split('|')[1] // Get query part after ID
        if (filterQuery) {
          const response = await fetch(`/api/todoist/filter-tasks?filter=${encodeURIComponent(filterQuery)}`)
          if (response.ok) {
            filteredTasks = await response.json()
          } else {
            console.error('Failed to fetch filtered tasks')
            setToast({ message: 'Failed to fetch filtered tasks', type: 'error' })
          }
        }
      } else {
        // For other modes, filter from globally filtered data
        if (globallyFilteredTasks.length === 0) {
          setLoadingTasks(false)
          return
        }
        // Note: assigneeFilter is already applied in globallyFilteredTasks, so pass 'all' to avoid double filtering
        filteredTasks = filterTasksByMode(globallyFilteredTasks, mode, projectMetadata, 'all', currentUserId)
      }
      
      // NEW QUEUE ARCHITECTURE: Update master store and reset queue
      if (filteredTasks.length > 0) {
        // 1. Update master task store
        const taskMap = filteredTasks.reduce((acc, task) => {
          acc[task.id] = task
          return acc
        }, {} as Record<string, TodoistTask>)
        
        setMasterTasks(prev => ({ ...prev, ...taskMap }))
        
        // 2. Reset queue to new task IDs
        const taskIds = filteredTasks.map(task => task.id)
        setTaskQueue(taskIds)
        
        // 3. Reset position tracking
        setQueuePosition(0)
        setActiveQueuePosition(0) // Reset active queue position
        setProcessedTaskIds([])
        setSkippedTaskIds([])
        
        setTaskKey(prev => prev + 1) // Force TaskForm to re-render with new task
      } else {
        // Empty state
        setTaskQueue([])
        setQueuePosition(0)
        setActiveQueuePosition(0) // Reset active queue position
        setProcessedTaskIds([])
        setSkippedTaskIds([])
      }
      
    
      // Prefetch suggestions in the background (non-blocking) - only for inbox tasks
      if (filteredTasks.length > 0 && projectHierarchy) {
        const inboxProject = projects.find(p => p.isInboxProject)
        if (inboxProject && mode.type === 'project' && mode.value === inboxProject.id) {
          // Only prefetch for first 3 tasks to avoid too many API calls
          const tasksToPreload = filteredTasks.slice(0, 3)
          suggestionsCache.prefetchSuggestions(tasksToPreload, projectHierarchy)
            .catch(error => console.warn('Failed to prefetch suggestions:', error))
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      setToast({ message: 'Failed to load tasks', type: 'error' })
    } finally {
      setLoadingTasks(false)
    }
  }, [projectHierarchy, setToast, globallyFilteredTasks, currentUserId, projectMetadata])


  // Helper function to check if processing mode has a meaningful value to filter by
  const hasMeaningfulValue = (mode: ProcessingMode): boolean => {
    if (!mode.value) return false;
    
    // Handle different value types
    if (Array.isArray(mode.value)) {
      return mode.value.length > 0;
    }
    
    // Check for placeholder/empty values
    const placeholderValues = [
      'Select project...', 'Select priority...', 'Select labels...',
      'Select date...', 'Select deadline...', 'Select preset...', 'Select all...',
      ''
    ];
    
    return !placeholderValues.includes(mode.value as string);
  };

  // Load tasks when processing mode changes (NOT assignee filter)
  useEffect(() => {
    if (hasMeaningfulValue(processingMode) && (processingMode.type === 'filter' || allTasksGlobal.length > 0)) {
      loadTasksForMode(processingMode)
    }
  }, [processingMode, loadTasksForMode, allTasksGlobal.length])

  // Update focused task when current task changes
  useEffect(() => {
    if (viewMode === 'processing' && currentTask) {
      setFocusedTask(currentTask.id, currentTask, {
        processingMode,
        queuePosition: activeQueuePosition
      })
    } else {
    }
  }, [currentTask, viewMode, processingMode, activeQueuePosition, setFocusedTask])

  // Load suggestions when current task changes
  useEffect(() => {
    async function loadSuggestions() {
      // Check if current task is in inbox
      const currentProject = projects.find(p => p.id === currentTask?.projectId)
      const isInboxTask = currentProject?.isInboxProject || false
      
      // Loading suggestions for current task
      
      // Only generate suggestions for inbox tasks
      if (!currentTask || !projectHierarchy || !isInboxTask) {
        setCurrentTaskSuggestions([])
        return
      }

      try {
        const suggestions = await suggestionsCache.generateSuggestions(
          currentTask.id,
          currentTask.content,
          currentTask.description || '',
          projectHierarchy,
          currentTask.projectId
        )
        
        // Suggestions loaded from cache
        
        // Filter out inbox suggestions
        const filteredSuggestions = suggestions.filter(s => {
          const project = projects.find(p => p.id === s.projectId)
          // Check suggestion validity
          return project && !project.isInboxProject
        })
        
        // Suggestions filtered and set
        setCurrentTaskSuggestions(filteredSuggestions)
      } catch (error) {
        console.error('Error loading suggestions:', error)
        setCurrentTaskSuggestions([])
      }
    }

    loadSuggestions()
  }, [currentTask?.id, currentTask?.content, currentTask?.description, currentTask?.projectId, projectHierarchy, projects])
  
  // Load assignee when current task changes
  useEffect(() => {
    async function loadAssigneeData() {
      if (!currentTask) {
        setCurrentTaskAssignee(undefined)
        return
      }

      // Find the assignee from all available users
      if (currentTask.assigneeId && collaboratorsData?.allUsers) {
        const assignee = collaboratorsData.allUsers.find(
          user => String(user.id) === String(currentTask?.assigneeId)
        )
        
        if (assignee) {
          // Assignee found
          setCurrentTaskAssignee(assignee)
        } else {
          // If we can't find the assignee in collaborators, create a placeholder
          // Created placeholder assignee
          setCurrentTaskAssignee({
            id: currentTask.assigneeId,
            name: `User ${currentTask.assigneeId}`,
            email: '',
            avatarSmall: undefined,
            avatarMedium: undefined,
            avatarBig: undefined
          })
        }
      } else {
        setCurrentTaskAssignee(undefined)
      }
    }

    loadAssigneeData()
  }, [currentTask?.id, currentTask?.assigneeId, collaboratorsData])
  
  // Removed queue completion detection as it's now integrated into empty state

  // NEW QUEUE ARCHITECTURE: Only update master store, queue unchanged
  const autoSaveTask = useCallback(async (taskId: string, updates: TaskUpdate) => {
    // Get the current task data
    const currentTaskData = masterTasks[taskId]
    if (!currentTaskData) {
      console.error(`Task ${taskId} not found in master store`)
      return
    }

    // Store original values for rollback
    const originalValues: Partial<TodoistTask> = {}
    
    // OPTIMISTIC UPDATE: Update local state immediately
    setMasterTasks(prev => {
      const existingTask = prev[taskId]
      if (!existingTask) return prev
      
      let updatedTask = { ...existingTask }
      
      // Store original values and apply updates
      Object.keys(updates).forEach(key => {
        const updateKey = key as keyof TaskUpdate
        originalValues[updateKey] = existingTask[updateKey] as any
        
        if (updateKey === 'projectId' && updates.projectId !== undefined) {
          updatedTask.projectId = updates.projectId
        } else if (updateKey === 'priority' && updates.priority !== undefined) {
          updatedTask.priority = updates.priority
        } else if (updateKey === 'labels' && updates.labels !== undefined) {
          updatedTask.labels = updates.labels
        } else if (updateKey === 'content' && updates.content !== undefined) {
          updatedTask.content = updates.content
        } else if (updateKey === 'description' && updates.description !== undefined) {
          updatedTask.description = updates.description
        } else if (updateKey === 'assigneeId' && updates.assigneeId !== undefined) {
          updatedTask.assigneeId = updates.assigneeId
          updatedTask.responsibleUid = updates.assigneeId || null
        } else if (updateKey === 'dueString' && updates.dueString !== undefined) {
          if (updates.due) {
            updatedTask.due = updates.due
          } else if (updates.dueString === '') {
            updatedTask.due = null
          }
        } else if (updateKey === 'deadline' && updates.deadline !== undefined) {
          if (updates.deadline === null) {
            updatedTask.duration = null
          } else if (updatedTask.duration) {
            updatedTask.duration = {
              ...updatedTask.duration,
              amount: Math.ceil((new Date(updates.deadline).getTime() - new Date(updatedTask.due?.date || new Date()).getTime()) / (1000 * 60 * 60 * 24)),
              unit: 'day' as const
            }
          }
        }
      })
      
      return {
        ...prev,
        [taskId]: updatedTask
      }
    })

    try {
      // Auto-saving task
      
      // Update the task via API
      const response = await fetch(`/api/todoist/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      // API response received
      
      if (!response.ok) {
        const errorData = await response.json()
        // API error occurred
        throw new Error(`Failed to update task: ${errorData.error || response.statusText}`)
      }

      const responseData = await response.json()
      // Response data processed
      
      // Update with server response (in case server modified the data)
      setMasterTasks(prev => {
        const existingTask = prev[taskId]
        if (!existingTask) return prev // Task not in master store
        
        let updatedTask = { ...existingTask }
        
        // If we have parsed dates from API, use them
        if (responseData.dates) {
          if (responseData.dates.due !== undefined) {
            updatedTask.due = responseData.dates.due
          }
          if (responseData.dates.deadline !== undefined) {
            updatedTask.deadline = responseData.dates.deadline
          }
          // Apply other updates
          Object.keys(updates).forEach(key => {
            if (key !== 'dueString' && key !== 'deadline' && key !== 'due') {
              (updatedTask as any)[key] = updates[key as keyof TaskUpdate]
            }
          })
        } else if (responseData.task) {
          // Preserve deadline since REST API doesn't return it
          const existingDeadline = updatedTask.deadline
          updatedTask = { ...updatedTask, ...responseData.task }
          if (existingDeadline && !responseData.task.deadline) {
            updatedTask.deadline = existingDeadline
          }
        } else {
          // Apply updates manually
          // Special handling for dates to maintain proper structure
          if ('dueString' in updates || 'due' in updates) {
            if (updates.due) {
              updatedTask.due = updates.due
            } else if (updates.dueString) {
              updatedTask.due = { 
                date: updates.dueString, 
                string: updates.dueString,
                recurring: false 
              }
            } else {
              updatedTask.due = undefined
            }
          }
          if ('deadline' in updates) {
            if (updates.deadline && typeof updates.deadline === 'string') {
              updatedTask.deadline = { 
                date: updates.deadline, 
                string: updates.deadline
              }
            } else if (typeof updates.deadline === 'object') {
              updatedTask.deadline = updates.deadline
            } else {
              updatedTask.deadline = undefined
            }
          }
          // Apply other updates
          Object.keys(updates).forEach(key => {
            if (key !== 'dueString' && key !== 'deadline' && key !== 'due') {
              (updatedTask as any)[key] = updates[key as keyof TaskUpdate]
            }
          })
        }
        
        return {
          ...prev,
          [taskId]: updatedTask
        }
      })
      
      // Only update allTasksGlobal in list mode to prevent queue reload in processing mode
      if (viewMode === 'list') {
        setAllTasksGlobal(prev => {
          const index = prev.findIndex(t => t.id === taskId)
          if (index !== -1) {
            const updated = [...prev]
            const existingTask = updated[index]
            
            if (responseData.dates) {
              if (responseData.dates.due !== undefined) {
                existingTask.due = responseData.dates.due
              }
              if (responseData.dates.deadline !== undefined) {
                existingTask.deadline = responseData.dates.deadline
              }
              Object.keys(updates).forEach(key => {
                if (key !== 'dueString' && key !== 'deadline' && key !== 'due') {
                  (existingTask as any)[key] = updates[key as keyof TaskUpdate]
                }
              })
            } else {
              Object.assign(existingTask, updates)
            }
            
            return updated
          }
          return prev
        })
      }
      
    } catch (err) {
      console.error('Error auto-saving task:', err)
      
      // ROLLBACK: Revert optimistic update on error
      setMasterTasks(prev => {
        const existingTask = prev[taskId]
        if (!existingTask) return prev
        
        // Restore original values
        const revertedTask = { ...existingTask }
        Object.keys(originalValues).forEach(key => {
          const taskKey = key as keyof TodoistTask
          ;(revertedTask as any)[taskKey] = originalValues[taskKey]
        })
        
        return {
          ...prev,
          [taskId]: revertedTask
        }
      })
      
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to save changes', 
        type: 'error' 
      })
      throw err
    }
  }, [masterTasks, viewMode, processingMode.type])

  const handleContentChange = useCallback(async (newContent: string) => {
    if (currentTask) {
      // Invalidate suggestions cache since content changed
      suggestionsCache.invalidateTask(currentTask.id)
      await autoSaveTask(currentTask.id, { content: newContent })
    }
  }, [currentTask, autoSaveTask])


  // Note: This handler is no longer used - OverlayManager handles priority selection directly

  const handleProjectSelect = useCallback(async (projectId: string) => {
    // Used by ProjectSuggestions component - operates on current task
    if (currentTask) {
      // autoSaveTask now handles optimistic updates and rollback
      await autoSaveTask(currentTask.id, { projectId })
    }
  }, [currentTask, autoSaveTask])

  const handleLabelsChange = useCallback(async (labels: string[]) => {
    // Used by handleLabelRemove - operates on current task
    if (currentTask) {
      // autoSaveTask now handles optimistic updates and rollback
      await autoSaveTask(currentTask.id, { labels })
    }
  }, [currentTask, autoSaveTask])

  const handleDescriptionChange = useCallback(async (newDescription: string) => {
    if (currentTask) {
      // Invalidate suggestions cache since description changed
      suggestionsCache.invalidateTask(currentTask.id)
      
      // autoSaveTask now handles optimistic updates and rollback
      await autoSaveTask(currentTask.id, { description: newDescription })
    }
  }, [currentTask, autoSaveTask])

  const handleLabelRemove = useCallback((labelName: string) => {
    if (currentTask) {
      const newLabels = currentTask.labels.filter(l => l !== labelName)
      handleLabelsChange(newLabels)
    }
  }, [currentTask, handleLabelsChange])

  const navigateToNextTask = useCallback(() => {
    if (activeQueue.length === 0) return
    if (activeQueuePosition >= activeQueue.length - 1) return // Already at the end
    
    setActiveQueuePosition(prev => prev + 1)
    setTaskKey(prev => prev + 1) // Force re-render
  }, [activeQueue.length, activeQueuePosition])

  const navigateToPrevTask = useCallback(() => {
    if (activeQueue.length === 0) return
    if (activeQueuePosition <= 0) return // Already at the beginning
    
    setActiveQueuePosition(prev => prev - 1)
    setTaskKey(prev => prev + 1) // Force re-render
  }, [activeQueue.length, activeQueuePosition])

  const handleNext = useCallback(() => {
    // Use new architecture navigation
    navigateToNextTask()
  }, [navigateToNextTask])

  // Note: handleScheduledDateChange is no longer used - OverlayManager handles scheduled date changes directly

  // Note: handleDeadlineChange is no longer used - OverlayManager handles deadline changes directly

  // Note: handleAssigneeSelect is no longer used - OverlayManager handles assignee selection directly

  const handleProcessTask = useCallback(() => {
    if (!currentTask) return
    
    // Store the current task ID
    const taskId = currentTask.id
    
    // Mark as processed (local state only)
    setProcessedTaskIds(prev => [...prev, taskId])
    
    // Show success message
    setToast({ message: 'Task processed', type: 'success' })
    
    // The activeQueue will automatically update due to the processedTaskIds change
    // Keep position the same (next task will slide into current position)
    // Unless we're at the end of the queue
    if (activeQueuePosition >= activeQueue.length - 1 && activeQueue.length > 1) {
      // If we're at the last task and there are other tasks, go back one
      setActiveQueuePosition(prev => Math.max(0, prev - 1))
    }
    
    setTaskKey(prev => prev + 1) // Force re-render
  }, [currentTask, activeQueuePosition, activeQueue.length])

  const handleCompleteTask = useCallback(async () => {
    // Use focusedTask from overlay manager or currentTask if in processing view
    const taskToComplete = focusedTask || currentTask
    if (!taskToComplete) return
    
    // Close the overlay immediately to prevent UI issues
    closeOverlay('complete')
    
    // Store the current task ID
    const taskId = taskToComplete.id
    
    // If in list view, update the highlighted task before marking as processed
    if (viewMode === 'list' && listViewState.highlightedTaskId === taskId) {
      // Calculate next highlighted task
      const currentTasks = activeQueue.filter(id => !processedTaskIds.includes(id))
      const completedIndex = currentTasks.findIndex(id => id === taskId)
      const remainingTasks = currentTasks.filter(id => id !== taskId)
      
      let nextHighlightedId: string | null = null
      if (remainingTasks.length > 0) {
        const nextIndex = Math.min(completedIndex, remainingTasks.length - 1)
        nextHighlightedId = remainingTasks[nextIndex]
      }
      
      setListViewState(prev => ({
        ...prev,
        highlightedTaskId: nextHighlightedId
      }))
      
      // Return focus to ListView after a brief delay
      setTimeout(() => {
        const listView = document.querySelector('[data-list-view-container]') as HTMLElement
        if (listView) {
          listView.focus()
        }
      }, 100)
    }
    
    // Mark as processed
    setProcessedTaskIds(prev => [...prev, taskId])
    
    // Show optimistic success message
    setToast({ message: 'Task completed', type: 'success' })
    
    // Handle position adjustment for processing view
    if (viewMode === 'processing' && activeQueuePosition >= activeQueue.length - 1 && activeQueue.length > 1) {
      setActiveQueuePosition(prev => Math.max(0, prev - 1))
    }
    
    // Note: Overlay state is now managed by OverlayManager
    
    setTaskKey(prev => prev + 1)
    
    // Handle the API request in the background
    try {
      const response = await fetch(`/api/todoist/tasks/${taskId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to complete task')
      }
      
      // Update the task as completed in local state
      setMasterTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: true
        }
      }))
      
      // Also update in allTasksGlobal if it exists there
      setAllTasksGlobal(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, isCompleted: true }
            : task
        )
      )
    } catch (err) {
      console.error('Error completing task:', err)
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to complete task', 
        type: 'error' 
      })
    }
  }, [focusedTask, currentTask, closeOverlay, masterTasks, viewMode, listViewState.highlightedTaskId, activeQueue, processedTaskIds, activeQueuePosition, setToast, setMasterTasks, setAllTasksGlobal])

  const handleProgressToNextQueue = useCallback(() => {
    const queueState = processingModeSelectorRef.current?.queueState
    if (!queueState?.hasNextQueue) return
    
    // Move to next queue and get the result
    const nextQueue = queueState.moveToNextQueue()
    if (!nextQueue) return
    
    // Create processing mode from the next queue
    let newMode: ProcessingMode
    
    // For prioritized mode, we need to construct the proper JSON value
    if (processingMode.type === 'prioritized') {
      const prioritizedValue = {
        filterType: nextQueue.type,
        filterValue: nextQueue.id,
        isPriorityProject: nextQueue.metadata?.isPriorityProject || false
      }
      
      newMode = {
        type: 'prioritized',
        value: JSON.stringify(prioritizedValue),
        displayName: nextQueue.label
      }
    } else {
      // For other modes, use the standard approach
      newMode = {
        type: processingMode.type,
        value: Array.isArray(nextQueue.id) ? nextQueue.id : String(nextQueue.id),
        displayName: nextQueue.label
      }
    }
    
    // Update the processing mode state (this will update the dropdown)
    setProcessingMode(newMode)
    
    // Load tasks for the new queue
    loadTasksForMode(newMode)
    
    // Show success toast
    setToast({ 
      message: `Moving to ${nextQueue.label}`, 
      type: 'info' 
    })
  }, [processingMode.type, loadTasksForMode])

  // Unified overlay handler
  const handleOpenOverlay = useCallback((type: OverlayType, taskId?: string) => {
    if (taskId) {
      const task = masterTasks[taskId]
      if (task) {
        setFocusedTask(taskId, task, {
          processingMode,
          queuePosition: activeQueuePosition
        })
      }
    }
    openOverlay(type)
  }, [masterTasks, setFocusedTask, openOverlay, processingMode, activeQueuePosition])


  // Handle task updates from ListView
  const handleListViewTaskUpdate = useCallback(async (taskId: string, updates: TaskUpdate) => {
    await autoSaveTask(taskId, updates)
  }, [autoSaveTask])

  // Handle task completion from ListView - complete directly without confirmation
  const handleListViewTaskComplete = useCallback(async (taskId: string) => {
    // Complete the task directly - the animation delay is the confirmation
    const task = masterTasks[taskId]
    if (!task) return
    
    try {
      // Complete (not delete) the task in Todoist immediately
      const response = await fetch(`/api/todoist/tasks/${taskId}/complete`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to complete task in Todoist')
      }

      // Start slide-out animation
      setSlidingOutTaskIds(prev => [...prev, taskId])
      
      // After animation completes, mark as processed
      setTimeout(() => {
        setProcessedTaskIds(prev => {
          if (prev.includes(taskId)) return prev
          return [...prev, taskId]
        })
        
        // Remove from sliding out state
        setSlidingOutTaskIds(prev => prev.filter(id => id !== taskId))
      }, 400) // Match the animation duration
      
      // Update list view highlighted task
      if (listViewState.highlightedTaskId === taskId) {
        // Calculate next highlighted task
        const currentTasks = activeQueue.filter(id => !processedTaskIds.includes(id) && id !== taskId)
        const completedIndex = activeQueue.findIndex(id => id === taskId)
        
        let nextHighlightedId: string | null = null
        if (currentTasks.length > 0) {
          // Try to highlight the task at the same position, or the last one if we're at the end
          const nextIndex = Math.min(completedIndex, currentTasks.length - 1)
          nextHighlightedId = currentTasks[nextIndex]
        }
        
        setListViewState(prev => ({
          ...prev,
          highlightedTaskId: nextHighlightedId
        }))
      }

      // Update the task as completed in local state
      setMasterTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          isCompleted: true
        }
      }))
      
      // Also update in global tasks list
      setAllTasksGlobal(prev => prev.map(task => 
        task.id === taskId ? { ...task, isCompleted: true } : task
      ))
      
      // Show success toast
      setToast({
        type: 'success',
        message: 'Task completed',
      })
    } catch (error) {
      console.error('Error completing task:', error)
      setToast({
        type: 'error',
        message: 'Failed to complete task',
      })
    }
  }, [masterTasks, activeQueue, processedTaskIds, listViewState.highlightedTaskId, loadTasksForMode, processingMode])

  // Handle task processing from ListView (switch to processing view)
  const handleListViewTaskProcess = useCallback((taskId: string) => {
    // Find the position of this task in the active queue
    const position = activeQueue.findIndex(id => id === taskId)
    if (position !== -1) {
      setActiveQueuePosition(position)
      setViewMode('processing')
      setTaskKey(prev => prev + 1) // Force re-render
    }
  }, [activeQueue])

  // Handle task deletion from ListView - permanently delete task
  const handleListViewTaskDelete = useCallback(async (taskId: string) => {
    const task = masterTasks[taskId]
    if (!task) return
    
    try {
      // Delete the task in Todoist permanently
      const response = await fetch(`/api/todoist/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task in Todoist')
      }

      // Start slide-out animation
      setSlidingOutTaskIds(prev => [...prev, taskId])
      
      // After animation completes, mark as processed (removed from list)
      setTimeout(() => {
        setProcessedTaskIds(prev => {
          if (prev.includes(taskId)) return prev
          return [...prev, taskId]
        })
        
        // Remove from sliding out state
        setSlidingOutTaskIds(prev => prev.filter(id => id !== taskId))
      }, 400) // Match the animation duration
      
      // Update list view highlighted task if needed
      if (listViewState.highlightedTaskId === taskId) {
        // Calculate next highlighted task
        const currentTasks = activeQueue.filter(id => !processedTaskIds.includes(id) && id !== taskId)
        const deletedIndex = activeQueue.findIndex(id => id === taskId)
        
        let nextHighlightedId: string | null = null
        if (currentTasks.length > 0) {
          // Try to highlight the task at the same position, or the last one if we're at the end
          const nextIndex = Math.min(deletedIndex, currentTasks.length - 1)
          nextHighlightedId = currentTasks[nextIndex]
        }
        
        setListViewState(prev => ({
          ...prev,
          highlightedTaskId: nextHighlightedId
        }))
      }
      
      // Show success toast
      setToast({
        type: 'success',
        message: 'Task deleted',
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      setToast({
        type: 'error',
        message: 'Failed to delete task',
      })
    }
  }, [masterTasks, activeQueue, processedTaskIds, listViewState.highlightedTaskId])

  // Use the unified keyboard shortcuts hook - only in processing mode
  useTaskKeyboardShortcuts({
    enabled: !loading && viewMode === 'processing',
    hasCollaborators: hasCollaboratorsForCurrentProject(),
    onProcessTask: handleProcessTask,
    onCompleteTask: () => openOverlay('complete')
  })

  // Additional keyboard shortcuts for queue navigation and view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in any empty/completed state (no current task)
      if (!currentTask) {
        const queueState = processingModeSelectorRef.current?.queueState
        const isQueueCompleted = totalTasks > 0 && processedTaskIds.length === taskQueue.length
        const isQueueEmpty = totalTasks === 0
        
        // Right arrow or Enter to continue to next queue (works for both empty and completed queues)
        if (queueState?.hasNextQueue && (e.key === 'ArrowRight' || e.key === 'Enter') && (isQueueCompleted || isQueueEmpty)) {
          e.preventDefault()
          handleProgressToNextQueue()
          return
        }
        
        // R to refresh current queue (works for both empty and completed queues)
        if ((e.key === 'r' || e.key === 'R') && (isQueueCompleted || isQueueEmpty)) {
          e.preventDefault()
          loadTasksForMode(processingMode)
          return
        }
      }
      
      // Only handle shortcuts when not typing in an input or when dropdowns are open
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          document.querySelector('[role="listbox"]') ||
          document.querySelector('.dropdown-open')) {
        return
      }

      switch (e.key) {
        case 'v':
        case 'V':
          e.preventDefault()
          setViewMode(prev => prev === 'processing' ? 'list' : 'processing')
          break
        case 'l':
        case 'L':
          e.preventDefault()
          setViewMode('list')
          break
        case 'j':
        case 'J':
        case 'ArrowRight':
          // Only handle in processing mode
          if (viewMode === 'processing') {
            e.preventDefault()
            navigateToNextTask()
          }
          break
        case 'k':
        case 'K':
        case 'ArrowLeft':
          // Only handle in processing mode
          if (viewMode === 'processing') {
            e.preventDefault()
            navigateToPrevTask()
          }
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(!showShortcuts)
          break
        // Dynamic processing mode switching based on index
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault()
          const modeIndex = parseInt(e.key) - 1
          if (modeIndex < PROCESSING_MODE_OPTIONS.length) {
            processingModeSelectorRef.current?.switchToMode(PROCESSING_MODE_OPTIONS[modeIndex].type)
          }
          break
        case 'Escape':
        case '`':
          setShowShortcuts(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateToNextTask, navigateToPrevTask, showShortcuts, currentTask, totalTasks, processedTaskIds, taskQueue, handleProgressToNextQueue, processingMode, viewMode, setViewMode, loadTasksForMode])


  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-todoist-blue mx-auto"></div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Loading Todoist Data...</h1>
          <p className="text-gray-600">Fetching your inbox tasks, projects, and labels</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-todoist-blue text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!currentTask && queuedTasks.length === 0 && !loading) {
    const displayName = processingMode.displayName || 'Tasks'
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Modern Header Section */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            {/* Compact Top Bar */}
            <div className="px-4 py-2 flex items-center justify-between">
              {/* Left side - View Toggle & Assignee Filter */}
              <div className="flex items-center gap-3">
                <ViewModeToggle
                  mode={viewMode}
                  onModeChange={setViewMode}
                  taskCount={activeQueue.length}
                />
                <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
                <AssigneeFilter
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  tasks={allTasksGlobal}
                  currentUserId={currentUserId}
                />
              </div>
              
              {/* Right side - Queue info and Sync Status */}
              <div className="flex items-center gap-3">
                {totalTasks > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{completedTasks}/{totalTasks}</span>
                      <span className="text-xs">completed</span>
                    </div>
                    <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
                  </>
                )}
                <SyncStatus />
                <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
                <SettingsButton onClick={() => setShowSettingsModal(true)} />
              </div>
            </div>
            
            {/* Processing Mode Selector - Hide in multi-list mode */}
            {settings.listView.multiListMode && viewMode === 'list' && processingMode.type === 'prioritized' ? (
              <div className="px-4 py-3">
                <MultiListModeIndicator isActive={true} />
              </div>
            ) : (
              <ProcessingModeSelector
                ref={processingModeSelectorRef}
                mode={processingMode}
                onModeChange={setProcessingMode}
                projects={projects}
                allTasks={globallyFilteredTasks}
                allTasksGlobal={globallyFilteredTasks}
                taskCounts={getTaskCountsForProjects(globallyFilteredTasks, projects.map(p => p.id), 'all', currentUserId)}
                labels={labels}
                projectMetadata={projectMetadata}
                currentUserId={currentUserId}
                assigneeFilter={assigneeFilter}
              />
            )}
          </div>
        </div>
        
        {/* Loading State for Task Switching */}
        {loadingTasks && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 my-4 mx-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-todoist-blue"></div>
              <span className="text-gray-600">Loading tasks...</span>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto p-4">

          {/* Empty State */}
          {!loadingTasks && (
            <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {totalTasks === 0 ? '📭' : '🎉'}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {totalTasks === 0 ? `${displayName} is Empty` : `${displayName} Complete!`}
                </h1>
                <p className="text-gray-600 mb-4">
                  {totalTasks === 0 
                    ? `No tasks found for ${displayName}. Try selecting different criteria.`
                    : 'All tasks have been processed.'
                  }
                </p>
                {totalTasks > 0 && (
                  <div className="text-sm text-gray-500 mb-6">
                    Processed: {processedTaskIds.length} • Skipped: {skippedTaskIds.length}
                  </div>
                )}
                
                {/* Queue Completion/Empty State */}
                {(() => {
                  const queueState = processingModeSelectorRef.current?.queueState
                  const isEmptyQueue = totalTasks === 0
                  const isQueueCompleted = totalTasks > 0
                  
                  return (
                    <QueueCompletionView
                      isEmptyQueue={isEmptyQueue}
                      hasNextQueue={queueState?.hasNextQueue || false}
                      nextQueueLabel={queueState?.nextQueue?.label}
                      nextQueueCount={queueState?.nextQueue?.count}
                      queueProgress={queueState?.queueProgress}
                      onContinue={handleProgressToNextQueue}
                      onRefresh={() => loadTasksForMode(processingMode)}
                    />
                  )
                })()}
              </div>
            </div>
          )}
        </div>
        
        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
        )}
        
        {/* Settings Modal - Must be rendered in empty state too */}
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Modern Header Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* Compact Top Bar */}
          <div className="px-4 py-2 flex items-center justify-between">
            {/* Left side - View Toggle & Assignee Filter */}
            <div className="flex items-center gap-3">
              <ViewModeToggle
                mode={viewMode}
                onModeChange={setViewMode}
                taskCount={activeQueue.length}
              />
              <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
              <AssigneeFilter
                value={assigneeFilter}
                onChange={setAssigneeFilter}
                tasks={allTasksGlobal}
                currentUserId={currentUserId}
              />
            </div>
            
            {/* Right side - Queue info and Sync Status */}
            <div className="flex items-center gap-3">
              {totalTasks > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{completedTasks}/{totalTasks}</span>
                    <span className="text-xs">completed</span>
                  </div>
                  <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
                </>
              )}
              <SyncStatus />
              <div className="h-5 w-px bg-gray-300 dark:bg-gray-700" />
              <SettingsButton onClick={() => setShowSettingsModal(true)} />
            </div>
          </div>
          
          {/* Processing Mode Selector - Hide in multi-list mode */}
          {settings.listView.multiListMode && viewMode === 'list' && processingMode.type === 'prioritized' ? (
            <div className="px-4 py-3">
              <MultiListModeIndicator isActive={true} />
            </div>
          ) : (
            <ProcessingModeSelector
              ref={processingModeSelectorRef}
              mode={processingMode}
              onModeChange={setProcessingMode}
              projects={projects}
              allTasks={globallyFilteredTasks}
              allTasksGlobal={globallyFilteredTasks}
              taskCounts={getTaskCountsForProjects(globallyFilteredTasks, projects.map(p => p.id), 'all', currentUserId)}
              labels={labels}
              projectMetadata={projectMetadata}
              currentUserId={currentUserId}
              assigneeFilter={assigneeFilter}
            />
          )}
        </div>
      </div>
        
        {/* Loading State for Task Switching */}
        {loadingTasks && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 my-4 mx-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-todoist-blue"></div>
              <span className="text-gray-600">Loading tasks...</span>
            </div>
          </div>
        )}

      <div className="max-w-4xl mx-auto p-4">
        {/* Main Content Area - conditional based on view mode */}
        {viewMode === 'list' ? (
          <UnifiedListView
            allTasks={globallyFilteredTasks}
            masterTasks={masterTasks}
            projects={projects}
            labels={labels}
            viewMode={settings.listView.multiListMode && processingMode.type === 'prioritized' ? 'multi' : 'single'}
            processingMode={processingMode}
            projectMetadata={projectMetadata}
            listViewState={listViewState}
            slidingOutTaskIds={slidingOutTaskIds}
            onListViewStateChange={setListViewState}
            onTaskUpdate={handleListViewTaskUpdate}
            onTaskComplete={handleListViewTaskComplete}
            onTaskProcess={handleListViewTaskProcess}
            onTaskDelete={handleListViewTaskDelete}
            onViewModeChange={setViewMode}
            currentUserId={currentUserId}
            assigneeFilter={assigneeFilter}
            collaborators={projectCollaborators}
            onOpenProjectOverlay={(taskId) => handleOpenOverlay('project', taskId)}
            onOpenPriorityOverlay={(taskId) => handleOpenOverlay('priority', taskId)}
            onOpenLabelOverlay={(taskId) => handleOpenOverlay('label', taskId)}
            onOpenScheduledOverlay={(taskId) => handleOpenOverlay('scheduled', taskId)}
            onOpenDeadlineOverlay={(taskId) => handleOpenOverlay('deadline', taskId)}
            onOpenAssigneeOverlay={(taskId) => handleOpenOverlay('assignee', taskId)}
            onOpenCompleteOverlay={(taskId) => handleOpenOverlay('complete', taskId)}
          />
        ) : currentTask && !loadingTasks ? (
          <div className="space-y-6">
            {/* Progress Indicator - only in Processing View */}
            {totalTasks > 0 && (
              <ProgressIndicator
                current={completedTasks}
                total={totalTasks}
                progress={progress}
              />
            )}
            
            {/* Show if all tasks are processed */}
            {processedTaskIds.length === taskQueue.length && taskQueue.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-green-800 mb-2">All Tasks Processed! 🎉</h3>
                <p className="text-green-700">
                  Great job! You&apos;ve processed all {taskQueue.length} tasks in this queue.
                  {(() => {
                    const queueState = processingModeSelectorRef.current?.queueState
                    if (!queueState?.hasNextQueue) {
                      return ' This was the last queue in the sequence.'
                    }
                    return ''
                  })()}
                </p>
              </div>
            )}
            
            {/* Show if task is already processed */}
            {processedTaskIds.includes(currentTask.id) && processedTaskIds.length < taskQueue.length && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 font-medium">This task has been processed</span>
              </div>
            )}
            
            {/* Full-width Task Card */}
            <TaskCard 
              task={currentTask} 
              projects={projects} 
              labels={labels} 
              assignee={currentTaskAssignee}
              hasCollaborators={hasCollaboratorsForCurrentProject()}
              dateLoadingState={dateLoadingStates[currentTask.id] || null}
              onContentChange={handleContentChange}
              onDescriptionChange={handleDescriptionChange}
              onProjectClick={() => {
                // Ensure current task is focused before opening overlay
                setFocusedTask(currentTask.id, currentTask, {
                  processingMode,
                  queuePosition: activeQueuePosition
                })
                openOverlay('project')
              }}
              onPriorityClick={() => {
                setFocusedTask(currentTask.id, currentTask, {
                  processingMode,
                  queuePosition: activeQueuePosition
                })
                openOverlay('priority')
              }}
              onLabelAdd={() => {
                setFocusedTask(currentTask.id, currentTask, {
                  processingMode,
                  queuePosition: activeQueuePosition
                })
                openOverlay('label')
              }}
              onLabelRemove={handleLabelRemove}
              onScheduledClick={() => {
                setFocusedTask(currentTask.id, currentTask, {
                  processingMode,
                  queuePosition: activeQueuePosition
                })
                openOverlay('scheduled')
              }}
              onDeadlineClick={() => {
                setFocusedTask(currentTask.id, currentTask, {
                  processingMode,
                  queuePosition: activeQueuePosition
                })
                openOverlay('deadline')
              }}
              onAssigneeClick={() => {
                setFocusedTask(currentTask.id, currentTask, {
                  processingMode,
                  queuePosition: activeQueuePosition
                })
                openOverlay('assignee')
              }}
            />

            {/* Project Metadata Display */}
            <ProjectMetadataDisplay
              project={projects.find(p => p.id === currentTask?.projectId)}
              metadata={projectMetadata[currentTask?.projectId || '']}
              allProjects={projects}
              collaborators={currentTask ? (projectCollaborators[currentTask.projectId] || []) : []}
              className="animate-fade-in"
            />

            {/* Project Suggestions */}
            {currentTaskSuggestions.length > 0 && (
              <ProjectSuggestions
                task={currentTask}
                projects={projects}
                suggestions={currentTaskSuggestions}
                onProjectSelect={handleProjectSelect}
              />
            )}

            {/* Task Form Controls */}
            <TaskForm
              key={taskKey} // Force re-render when task changes
              task={currentTask}
              projects={projects}
              labels={labels}
              suggestions={generateMockSuggestions(currentTask.content)}
              onAutoSave={(updates) => autoSaveTask(currentTask!.id, updates)}
              onNext={handleNext}
              onPrevious={navigateToPrevTask}
              canGoNext={activeQueuePosition < activeQueue.length - 1}
              canGoPrevious={activeQueuePosition > 0}
            />
          </div>
        ) : null}

        {/* Queue Preview - only show in processing mode */}
        {viewMode === 'processing' && queuedTasks.length > 0 && (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-full max-w-2xl p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
                Next in queue ({queuedTasks.length} remaining)
              </h3>
              <div className="space-y-2">
                {queuedTasks.slice(0, 10).map((task, index) => {
                  // Calculate opacity - fade out from task 5 to task 10
                  const opacity = index < 5 ? 1 : 1 - ((index - 4) * 0.2)
                  return (
                    <div 
                      key={task.id} 
                      className="text-sm text-gray-600 truncate text-center"
                      style={{ opacity }}
                    >
                      {index + 1}. {task.content}
                    </div>
                  )
                })}
                {queuedTasks.length > 10 && (
                  <div className="text-sm text-gray-400 text-center" style={{ opacity: 0.3 }}>
                    + {queuedTasks.length - 10} more...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}

      {/* Unified Overlay Manager */}
      <OverlayManager
        projects={projects}
        labels={labels}
        projectCollaborators={projectCollaborators}
        masterTasks={masterTasks}
        onTaskUpdate={autoSaveTask}
        suggestions={currentTaskSuggestions}
        onCompleteTask={handleCompleteTask}
      />
      

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />

      {/* Debug Info */}
      {isDebugMode && (
        <DebugInfo
          viewMode={viewMode}
          processingMode={processingMode}
          multiListMode={settings.listView.multiListMode}
          isListView={viewMode === 'list'}
          isPrioritized={processingMode.type === 'prioritized'}
          shouldShowMultiList={settings.listView.multiListMode && processingMode.type === 'prioritized'}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Debug Mode - kept at original location */}
      {isDebugMode && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs px-2 py-1 bg-gray-900 hover:bg-gray-800 rounded text-gray-100 font-mono"
            title="Toggle debug view"
          >
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
        </div>
      )}
      
      {/* Debug JSON View */}
      {showDebug && isDebugMode && (
        <div className="fixed top-32 right-4 max-w-2xl max-h-[80vh] overflow-auto z-50">
          <div className="bg-gray-900 rounded-lg p-4 space-y-4">
            {/* Current Queue */}
            <div>
              <h3 className="text-xs text-green-400 font-mono mb-2">Current Queue:</h3>
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify({
                  activePosition: activeQueuePosition,
                  activeQueue: activeQueue,
                  currentTaskId: currentTask?.id,
                  fullQueue: taskQueue,
                  processedIds: processedTaskIds,
                  totalInQueue: taskQueue.length,
                  totalInActiveQueue: activeQueue.length
                }, null, 2)}
              </pre>
            </div>
            
            {/* Suggested Projects */}
            {currentTaskSuggestions.length > 0 && (
              <div>
                <h3 className="text-xs text-green-400 font-mono mb-2">Suggested Projects:</h3>
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(currentTaskSuggestions, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}