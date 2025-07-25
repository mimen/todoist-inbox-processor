'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TodoistTask, TodoistProject, TodoistLabel, ProcessingState, TaskUpdate, TodoistUser, CollaboratorsData } from '@/lib/types'
import { generateMockSuggestions } from '@/lib/mock-data'
import { suggestionsCache } from '@/lib/suggestions-cache'
import { ProcessingMode } from '@/types/processing-mode'
import { filterTasksByMode, getTaskCountsForProjects } from '@/lib/task-filters'

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
import PriorityOverlay from './PriorityOverlay'
import ProjectSelectionOverlay from './ProjectSelectionOverlay'
import LabelSelectionOverlay from './LabelSelectionOverlay'
import ScheduledDateSelector from './ScheduledDateSelector'
import DeadlineSelector from './DeadlineSelector'
import ProjectSuggestions from './ProjectSuggestions'
import Toast from './Toast'
import AssigneeSelectionOverlay from './AssigneeSelectionOverlay'
import ProjectMetadataDisplay from './ProjectMetadataDisplay'
import AssigneeFilter, { AssigneeFilterType } from './AssigneeFilter'

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
  const [allTasksGlobal, setAllTasksGlobal] = useState<TodoistTask[]>([]) // Keep for loading tasks
  const [taskKey, setTaskKey] = useState(0) // Force re-render of TaskForm
  const [projectMetadata, setProjectMetadata] = useState<Record<string, any>>({})
  const [showPriorityOverlay, setShowPriorityOverlay] = useState(false)
  const [showProjectOverlay, setShowProjectOverlay] = useState(false)
  const [showLabelOverlay, setShowLabelOverlay] = useState(false)
  const [showScheduledOverlay, setShowScheduledOverlay] = useState(false)
  const [showDeadlineOverlay, setShowDeadlineOverlay] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentTaskSuggestions, setCurrentTaskSuggestions] = useState<any[]>([])
  const [showAssigneeOverlay, setShowAssigneeOverlay] = useState(false)
  const [collaboratorsData, setCollaboratorsData] = useState<CollaboratorsData | null>(null)
  const [currentTaskAssignee, setCurrentTaskAssignee] = useState<TodoistUser | undefined>(undefined)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterType>('not-assigned-to-others')
  const [projectCollaborators, setProjectCollaborators] = useState<Record<string, TodoistUser[]>>({})
  const [dateLoadingStates, setDateLoadingStates] = useState<Record<string, 'due' | 'deadline' | null>>({})
  // Removed showNextQueuePrompt as it's now integrated into empty state
  
  // NEW QUEUE ARCHITECTURE STATE
  // 1. Master task store - continuously updated as changes are made
  const [masterTasks, setMasterTasks] = useState<Record<string, TodoistTask>>({})
  
  // 2. Current queue - stable until explicit reload  
  const [taskQueue, setTaskQueue] = useState<string[]>([])
  
  // 3. Position tracking
  const [queuePosition, setQueuePosition] = useState(0)
  const [processedTaskIds, setProcessedTaskIds] = useState<string[]>([])
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([])
  
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

  // Load initial data (projects and labels)
  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log('🚀 Todoist Inbox Processor starting...')
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
          console.log(`👥 Loaded ${collaboratorsData.allUsers?.length || 0} users`)
          
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
        
        console.log(`📁 Loaded ${projectsData.length} projects, 🏷️  ${labelsData.length} labels`)
        
        // Set default to actual inbox project if it exists
        const inboxProject = projectsData.find((p: any) => p.isInboxProject)
        const inboxId = inboxProject?.id || 'inbox'
        setProcessingMode({
          type: 'project',
          value: inboxId,
          displayName: inboxProject?.name || 'Inbox'
        })
        
        // Load ALL tasks immediately using sync API
        const allTasksRes = await fetch('/api/todoist/all-tasks')
        let metadata: Record<string, any> = {}
        
        if (allTasksRes.ok) {
          const data = await allTasksRes.json()
          console.log(`📋 Loaded ${data.total} tasks`)
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
            
            console.log(`📥 ${inboxTasks.length} inbox tasks ready`)
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
            
            console.log(`📊 Built hierarchy for ${hierarchyData.summary.totalProjects} projects`)
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
            console.log(`🔍 ${mode.displayName}: ${filteredTasks.length} tasks`)
          } else {
            console.error('Failed to fetch filtered tasks')
            setToast({ message: 'Failed to fetch filtered tasks', type: 'error' })
          }
        }
      } else {
        // For other modes, filter from global data
        if (allTasksGlobal.length === 0) {
          setLoadingTasks(false)
          return
        }
        filteredTasks = filterTasksByMode(allTasksGlobal, mode, projectMetadata, assigneeFilter, currentUserId)
        console.log(`📋 ${mode.displayName}: ${filteredTasks.length} tasks`)
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
  }, [projectHierarchy, setToast, assigneeFilter, currentUserId, projectMetadata])


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

  // Load tasks when processing mode or assignee filter changes
  useEffect(() => {
    if (hasMeaningfulValue(processingMode) && (processingMode.type === 'filter' || allTasksGlobal.length > 0)) {
      loadTasksForMode(processingMode)
    }
  }, [processingMode, loadTasksForMode, assigneeFilter])

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
      
      // NEW ARCHITECTURE: Only update master task store
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
      
      // Also update allTasksGlobal for loading purposes
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
      
    } catch (err) {
      console.error('Error auto-saving task:', err)
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to save changes', 
        type: 'error' 
      })
      throw err
    }
  }, [masterTasks])

  const handleContentChange = useCallback(async (newContent: string) => {
    if (currentTask) {
      // Invalidate suggestions cache since content changed
      suggestionsCache.invalidateTask(currentTask.id)
      await autoSaveTask(currentTask.id, { content: newContent })
    }
  }, [currentTask, autoSaveTask])


  const handlePrioritySelect = useCallback(async (priority: 1 | 2 | 3 | 4) => {
    setShowPriorityOverlay(false) // Close immediately
    
    if (currentTask) {
      const originalPriority = currentTask.priority
      
      // Update the task immediately in the master store for optimistic UI
      setMasterTasks(prev => ({
        ...prev,
        [currentTask.id]: {
          ...prev[currentTask.id],
          priority
        }
      }))
      
      try {
        // Then update via API
        await autoSaveTask(currentTask.id, { priority })
      } catch (err) {
        // Revert on error
        setMasterTasks(prev => ({
          ...prev,
          [currentTask.id]: {
            ...prev[currentTask.id],
            priority: originalPriority
          }
        }))
      }
    }
  }, [currentTask, autoSaveTask])

  const handleProjectSelect = useCallback(async (projectId: string) => {
    setShowProjectOverlay(false) // Close immediately
    
    if (currentTask) {
      const originalProjectId = currentTask.projectId
      
      // Update the task immediately in the master store
      setMasterTasks(prev => ({
        ...prev,
        [currentTask.id]: {
          ...prev[currentTask.id],
          projectId
        }
      }))
      
      try {
        // Queue the auto-save
        await autoSaveTask(currentTask.id, { projectId })
      } catch (err) {
        // Revert on error
        setMasterTasks(prev => ({
          ...prev,
          [currentTask.id]: {
            ...prev[currentTask.id],
            projectId: originalProjectId
          }
        }))
      }
    }
  }, [currentTask, autoSaveTask])

  const handleLabelsChange = useCallback(async (labels: string[]) => {
    if (currentTask) {
      const originalLabels = currentTask.labels
      
      // Update the task immediately in the master store
      setMasterTasks(prev => ({
        ...prev,
        [currentTask.id]: {
          ...prev[currentTask.id],
          labels
        }
      }))
      
      try {
        // Queue the auto-save
        await autoSaveTask(currentTask.id, { labels })
      } catch (err) {
        // Revert on error
        setMasterTasks(prev => ({
          ...prev,
          [currentTask.id]: {
            ...prev[currentTask.id],
            labels: originalLabels
          }
        }))
      }
    }
  }, [currentTask, autoSaveTask])

  const handleDescriptionChange = useCallback(async (newDescription: string) => {
    if (currentTask) {
      // Invalidate suggestions cache since description changed
      suggestionsCache.invalidateTask(currentTask.id)
      
      // Update the task immediately in the master store
      setMasterTasks(prev => ({
        ...prev,
        [currentTask.id]: {
          ...prev[currentTask.id],
          description: newDescription
        }
      }))
      
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

  const handleScheduledDateChange = useCallback(async (dateString: string) => {
    if (!currentTask) return;
    
    // Capture the current task ID and due date immediately
    const taskId = currentTask.id;
    const originalDue = currentTask.due;
    
    try {
      // Set loading state
      setDateLoadingStates(prev => ({ ...prev, [taskId]: 'due' }))
      
      // Update UI state immediately with a temporary value
      if (dateString) {
        setMasterTasks(prev => {
          const task = prev[taskId]
          if (task) {
            return {
              ...prev,
              [taskId]: {
                ...task,
                due: {
                  date: dateString,
                  string: dateString,
                  recurring: false
                }
              }
            }
          }
          return prev
        })
      } else {
        // Clear the scheduled date
        setMasterTasks(prev => {
          const task = prev[taskId]
          if (task) {
            return {
              ...prev,
              [taskId]: {
                ...task,
                due: undefined
              }
            }
          }
          return prev
        })
      }
      
      // Then update the API
      // Note: The API will parse the dateString and return the proper date format
      // autoSaveTask will update all task arrays with the response
      const updates: any = { dueString: dateString }
      
      // For immediate UI update, we need to provide the due object structure
      if (dateString) {
        updates.due = { 
          date: dateString, // The API will return the proper ISO date
          string: dateString,
          recurring: false 
        }
      } else {
        updates.due = undefined
      }
      
      await autoSaveTask(taskId, updates)
      
      // Clear loading state after success
      setDateLoadingStates(prev => ({ ...prev, [taskId]: null }))
    } catch (error) {
      console.error('Error updating scheduled date:', error)
      // Clear loading state on error
      setDateLoadingStates(prev => ({ ...prev, [taskId]: null }))
      // Revert the UI state on error
      setMasterTasks(prev => {
        const task = prev[taskId]
        if (task) {
          return {
            ...prev,
            [taskId]: {
              ...task,
              due: originalDue
            }
          }
        }
        return prev
      })
    }
  }, [currentTask, autoSaveTask])

  const handleDeadlineChange = useCallback(async (dateString: string) => {
    if (!currentTask) return;
    
    // Capture the current task ID and deadline immediately
    const taskId = currentTask.id;
    const originalDeadline = currentTask.deadline;
    
    try {
      // Set loading state
      setDateLoadingStates(prev => ({ ...prev, [taskId]: 'deadline' }))
      
      // Update UI state immediately
      if (dateString) {
        setMasterTasks(prev => {
          const task = prev[taskId]
          if (task) {
            return {
              ...prev,
              [taskId]: {
                ...task,
                deadline: {
                  date: dateString,
                  string: dateString
                }
              }
            }
          }
          return prev
        })
      } else {
        // Clear the deadline
        setMasterTasks(prev => {
          const task = prev[taskId]
          if (task) {
            return {
              ...prev,
              [taskId]: {
                ...task,
                deadline: undefined
              }
            }
          }
          return prev
        })
      }
      
      // Then update the API
      // Note: The API will parse the dateString and return the proper date format
      // autoSaveTask will update all task arrays with the response
      const updates: any = { deadline: dateString || undefined }
      
      await autoSaveTask(taskId, updates)
      
      // Clear loading state after success
      setDateLoadingStates(prev => ({ ...prev, [taskId]: null }))
    } catch (error) {
      console.error('Error updating deadline:', error)
      // Clear loading state on error
      setDateLoadingStates(prev => ({ ...prev, [taskId]: null }))
      // Revert the UI state on error
      setMasterTasks(prev => {
        const task = prev[taskId]
        if (task) {
          return {
            ...prev,
            [taskId]: {
              ...task,
              deadline: originalDeadline
            }
          }
        }
        return prev
      })
    }
  }, [currentTask, autoSaveTask])

  const handleAssigneeSelect = useCallback(async (userId: string | null) => {
    setShowAssigneeOverlay(false) // Close immediately
    
    if (currentTask) {
      const originalAssigneeId = currentTask.assigneeId
      
      // Update the task immediately in the master store
      setMasterTasks(prev => ({
        ...prev,
        [currentTask.id]: {
          ...prev[currentTask.id],
          assigneeId: userId || undefined
        }
      }))
      
      // Update the current assignee display
      if (userId && collaboratorsData?.allUsers) {
        const newAssignee = collaboratorsData.allUsers.find(
          user => String(user.id) === String(userId)
        )
        setCurrentTaskAssignee(newAssignee)
      } else {
        setCurrentTaskAssignee(undefined)
      }
      
      try {
        // Queue the auto-save
        await autoSaveTask(currentTask.id, { assigneeId: userId || undefined })
      } catch (err) {
        // Revert on error
        setMasterTasks(prev => ({
          ...prev,
          [currentTask.id]: {
            ...prev[currentTask.id],
            assigneeId: originalAssigneeId
          }
        }))
        
        // Revert assignee display
        if (originalAssigneeId && collaboratorsData?.allUsers) {
          const originalAssignee = collaboratorsData.allUsers.find(
            user => String(user.id) === String(originalAssigneeId)
          )
          setCurrentTaskAssignee(originalAssignee)
        } else {
          setCurrentTaskAssignee(undefined)
        }
      }
    }
  }, [currentTask, autoSaveTask, projectCollaborators])

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
    if (!currentTask) return
    
    // Close the overlay immediately to prevent UI issues
    setShowCompleteConfirm(false)
    
    // Store the current task ID
    const taskId = currentTask.id
    
    // Mark as processed
    setProcessedTaskIds(prev => [...prev, taskId])
    
    // Show optimistic success message
    setToast({ message: 'Task completed', type: 'success' })
    
    // Handle position adjustment like in handleProcessTask
    if (activeQueuePosition >= activeQueue.length - 1 && activeQueue.length > 1) {
      setActiveQueuePosition(prev => Math.max(0, prev - 1))
    }
    
    setTaskKey(prev => prev + 1)
    
    // Handle the API request in the background
    try {
      const response = await fetch(`/api/todoist/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to complete task')
      }
    } catch (err) {
      console.error('Error completing task:', err)
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to complete task', 
        type: 'error' 
      })
    }
  }, [currentTask, activeQueue.length])

  const handleProgressToNextQueue = useCallback(() => {
    const queueState = processingModeSelectorRef.current?.queueState
    if (!queueState?.hasNextQueue) return
    
    // Get the next queue option BEFORE moving
    const nextQueue = queueState.nextQueue
    if (!nextQueue) return
    
    // Move to next queue
    queueState.moveToNextQueue()
    
    // Create processing mode from the next queue
    const newMode: ProcessingMode = {
      type: processingMode.type,
      value: Array.isArray(nextQueue.id) ? nextQueue.id : String(nextQueue.id),
      displayName: nextQueue.label
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in empty state with a next queue available
      if (!currentTask && totalTasks > 0 && processedTaskIds.length === taskQueue.length) {
        const queueState = processingModeSelectorRef.current?.queueState
        
        // Right arrow or Enter to continue to next queue
        if (queueState?.hasNextQueue && (e.key === 'ArrowRight' || e.key === 'Enter')) {
          e.preventDefault()
          handleProgressToNextQueue()
          return
        }
        
        // R to refresh current queue
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault()
          loadTasksForMode(processingMode)
          return
        }
      }
      
      // Also handle refresh in empty state with no tasks
      if (!currentTask && totalTasks === 0 && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        loadTasksForMode(processingMode)
        return
      }
      
      // Don't handle shortcuts when overlays are open - they handle their own keys
      if (showPriorityOverlay || showProjectOverlay || showLabelOverlay || showScheduledOverlay || showDeadlineOverlay || showAssigneeOverlay) {
        return
      }

      // Only handle shortcuts when not typing in an input or when dropdowns are open
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          document.querySelector('[role="listbox"]') ||
          document.querySelector('.dropdown-open') ||
          showAssigneeOverlay) {
        return
      }

      switch (e.key) {
        case 'p':
        case 'P':
          e.preventDefault()
          setShowPriorityOverlay(true)
          break
        case '#':
          e.preventDefault()
          setShowProjectOverlay(true)
          break
        case '@':
          e.preventDefault()
          setShowLabelOverlay(true)
          break
        case '+':
          e.preventDefault()
          if (hasCollaboratorsForCurrentProject()) {
            setShowAssigneeOverlay(true)
          }
          break
        case 's':
        case 'S':
          e.preventDefault()
          setShowScheduledOverlay(true)
          break
        case 'd':
        case 'D':
          e.preventDefault()
          setShowDeadlineOverlay(true)
          break
        case 'j':
        case 'J':
        case 'ArrowRight':
          e.preventDefault()
          navigateToNextTask()
          break
        case 'k':
        case 'K':
        case 'ArrowLeft':
          e.preventDefault()
          navigateToPrevTask()
          break
        case 'e':
        case 'E':
          e.preventDefault()
          handleProcessTask()
          break
        case 'c':
        case 'C':
          e.preventDefault()
          setShowCompleteConfirm(true)
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(!showShortcuts)
          break
        case '1':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('project')
          break
        case '2':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('priority')
          break
        case '3':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('label')
          break
        case '4':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('date')
          break
        case '5':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('deadline')
          break
        case '6':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('preset')
          break
        case '7':
          e.preventDefault()
          processingModeSelectorRef.current?.switchToMode('all')
          break
        case 'Escape':
        case '`':
          setShowShortcuts(false)
          setShowPriorityOverlay(false)
          setShowProjectOverlay(false)
          setShowLabelOverlay(false)
          setShowScheduledOverlay(false)
          setShowDeadlineOverlay(false)
          setShowCompleteConfirm(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateToNextTask, navigateToPrevTask, showShortcuts, showPriorityOverlay, showProjectOverlay, showLabelOverlay, showScheduledOverlay, showDeadlineOverlay, showAssigneeOverlay, hasCollaboratorsForCurrentProject, handleProcessTask, currentTask, totalTasks, processedTaskIds, taskQueue, handleProgressToNextQueue, processingMode])

  // Handle Enter key for confirmation dialogs
  useEffect(() => {
    const handleConfirmationKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && showCompleteConfirm) {
        e.preventDefault()
        handleCompleteTask()
      }
    }

    if (showCompleteConfirm) {
      window.addEventListener('keydown', handleConfirmationKeyDown)
      return () => window.removeEventListener('keydown', handleConfirmationKeyDown)
    }
  }, [showCompleteConfirm, handleCompleteTask])

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
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Task Processor</h1>
              <div className="flex items-center gap-3">
                <AssigneeFilter
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  tasks={allTasksGlobal}
                  currentUserId={currentUserId}
                />
                <div className="w-px h-6 bg-gray-300" />
                <Link
                  href="/projects"
                  className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Projects
                </Link>
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Shortcuts
                </button>
              </div>
            </div>
            
            {/* Processing Mode Selector */}
            <ProcessingModeSelector
              ref={processingModeSelectorRef}
              mode={processingMode}
              onModeChange={setProcessingMode}
              projects={projects}
              allTasks={allTasksGlobal}
              allTasksGlobal={allTasksGlobal}
              taskCounts={getTaskCountsForProjects(allTasksGlobal, projects.map(p => p.id), assigneeFilter, currentUserId)}
              labels={labels}
              projectMetadata={projectMetadata}
              currentUserId={currentUserId}
              assigneeFilter={assigneeFilter}
            />
            
            {/* Loading State for Task Switching */}
            {loadingTasks && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-todoist-blue"></div>
                  <span className="text-gray-600">Loading tasks...</span>
                </div>
              </div>
            )}
          </div>

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
                
                {/* Queue Progression Options */}
                {totalTasks > 0 && (() => {
                  const queueState = processingModeSelectorRef.current?.queueState
                  if (queueState?.hasNextQueue && queueState.nextQueue) {
                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 items-center">
                          <button
                            onClick={handleProgressToNextQueue}
                            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            Continue to {queueState.nextQueue.label}
                            {queueState.nextQueue.count && queueState.nextQueue.count > 0 && (
                              <span className="text-green-200">({queueState.nextQueue.count} tasks)</span>
                            )}
                            <div className="flex items-center gap-1 ml-2">
                              <kbd className="px-1.5 py-0.5 text-xs bg-green-700 rounded">→</kbd>
                              <kbd className="px-1.5 py-0.5 text-xs bg-green-700 rounded">↵</kbd>
                            </div>
                          </button>
                          <button
                            onClick={() => loadTasksForMode(processingMode)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            Refresh Current Queue
                            <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded">R</kbd>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Queue {queueState.queueProgress.current} of {queueState.queueProgress.total} completed
                        </p>
                      </div>
                    )
                  } else {
                    // Last queue or no next queue
                    return (
                      <div className="space-y-2">
                        <p className="text-green-600 font-medium mb-4">
                          🏁 Last queue completed!
                        </p>
                        <button
                          onClick={() => loadTasksForMode(processingMode)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          Refresh Tasks
                          <kbd className="px-1.5 py-0.5 text-xs bg-blue-700 rounded">R</kbd>
                        </button>
                      </div>
                    )
                  }
                })()}
                
                {/* Just show refresh for empty queues */}
                {totalTasks === 0 && (
                  <button
                    onClick={() => loadTasksForMode(processingMode)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Refresh Tasks
                    <kbd className="px-1.5 py-0.5 text-xs bg-blue-700 rounded">R</kbd>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Task Processor</h1>
            <div className="flex items-center gap-3">
              <AssigneeFilter
                value={assigneeFilter}
                onChange={setAssigneeFilter}
                tasks={allTasksGlobal}
                currentUserId={currentUserId}
              />
              <div className="w-px h-6 bg-gray-300" />
              <Link
                href="/projects"
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                Projects
              </Link>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                Shortcuts
              </button>
            </div>
          </div>
          
          {/* Processing Mode Selector */}
          <ProcessingModeSelector
            ref={processingModeSelectorRef}
            mode={processingMode}
            onModeChange={setProcessingMode}
            projects={projects}
            allTasks={allTasksGlobal}
            allTasksGlobal={allTasksGlobal}
            taskCounts={getTaskCountsForProjects(allTasksGlobal, projects.map(p => p.id), assigneeFilter, currentUserId)}
            labels={labels}
            projectMetadata={projectMetadata}
            currentUserId={currentUserId}
            assigneeFilter={assigneeFilter}
          />
          
          {/* Loading State for Task Switching */}
          {loadingTasks && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-todoist-blue"></div>
                <span className="text-gray-600">Loading tasks...</span>
              </div>
            </div>
          )}
          
          {totalTasks > 0 && (
            <ProgressIndicator
              current={completedTasks}
              total={totalTasks}
              progress={progress}
            />
          )}
        </div>

        {/* Main Processing Area */}
        {currentTask && !loadingTasks && (
          <div className="space-y-6">
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
              onProjectClick={() => setShowProjectOverlay(true)}
              onPriorityClick={() => setShowPriorityOverlay(true)}
              onLabelAdd={() => setShowLabelOverlay(true)}
              onLabelRemove={handleLabelRemove}
              onScheduledClick={() => setShowScheduledOverlay(true)}
              onDeadlineClick={() => setShowDeadlineOverlay(true)}
              onAssigneeClick={() => setShowAssigneeOverlay(true)}
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
        )}

        {/* Queue Preview */}
        {queuedTasks.length > 0 && (
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

      {/* Priority Overlay */}
      {currentTask && (
        <PriorityOverlay
          currentPriority={currentTask.priority}
          onPrioritySelect={handlePrioritySelect}
          onClose={() => setShowPriorityOverlay(false)}
          isVisible={showPriorityOverlay}
        />
      )}

      {/* Project Selection Overlay */}
      {currentTask && (
        <ProjectSelectionOverlay
          key={`project-overlay-${currentTask.id}`}
          projects={projects}
          currentProjectId={currentTask.projectId}
          currentTask={currentTask}
          suggestions={currentTaskSuggestions}
          onProjectSelect={handleProjectSelect}
          onClose={() => setShowProjectOverlay(false)}
          isVisible={showProjectOverlay}
        />
      )}

      {/* Label Selection Overlay */}
      {currentTask && (
        <LabelSelectionOverlay
          labels={labels}
          currentTask={currentTask}
          onLabelsChange={handleLabelsChange}
          onClose={() => setShowLabelOverlay(false)}
          isVisible={showLabelOverlay}
        />
      )}

      {/* Scheduled Date Selector */}
      {currentTask && (
        <ScheduledDateSelector
          currentTask={currentTask}
          onScheduledDateChange={handleScheduledDateChange}
          onClose={() => setShowScheduledOverlay(false)}
          isVisible={showScheduledOverlay}
        />
      )}

      {/* Deadline Selector */}
      {currentTask && (
        <DeadlineSelector
          currentTask={currentTask}
          onDeadlineChange={handleDeadlineChange}
          onClose={() => setShowDeadlineOverlay(false)}
          isVisible={showDeadlineOverlay}
        />
      )}

      {/* Assignee Selection Overlay */}
      {currentTask && (
        <AssigneeSelectionOverlay
          isVisible={showAssigneeOverlay}
          onClose={() => setShowAssigneeOverlay(false)}
          onAssigneeSelect={handleAssigneeSelect}
          currentAssigneeId={currentTask.assigneeId}
          collaborators={projectCollaborators[currentTask.projectId] || []}
        />
      )}

      {/* Complete Confirmation Dialog */}
      {showCompleteConfirm && currentTask && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowCompleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Complete Task?</h3>
            <p className="text-gray-600 mb-4">
              Mark this task as completed. This action can be undone from your completed tasks.
            </p>
            <p className="text-sm font-medium text-gray-800 mb-6 p-3 bg-gray-50 rounded">
              &ldquo;{currentTask.content}&rdquo;
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTask}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Mode */}
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