'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
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
      
      // The task's do date IS the project's do date
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
import ProcessingModeSelector from './ProcessingModeSelector'
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
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentTaskSuggestions, setCurrentTaskSuggestions] = useState<any[]>([])
  const [showAssigneeOverlay, setShowAssigneeOverlay] = useState(false)
  const [collaboratorsData, setCollaboratorsData] = useState<CollaboratorsData | null>(null)
  const [currentTaskAssignee, setCurrentTaskAssignee] = useState<TodoistUser | undefined>(undefined)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterType>('not-assigned-to-others')
  const [projectCollaborators, setProjectCollaborators] = useState<Record<string, TodoistUser[]>>({})
  const [dateLoadingStates, setDateLoadingStates] = useState<Record<string, 'due' | 'deadline' | null>>({})
  
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
  const currentTask = useMemo((): TodoistTask | null => {
    if (queuePosition >= taskQueue.length) return null
    const taskId = taskQueue[queuePosition]
    return masterTasks[taskId] || null
  }, [taskQueue, queuePosition, masterTasks])
  
  const queuedTasks = useMemo((): TodoistTask[] => {
    return taskQueue.slice(queuePosition + 1)
      .map(id => masterTasks[id])
      .filter(Boolean)
  }, [taskQueue, queuePosition, masterTasks])
  
  const totalTasks = taskQueue.length
  const completedTasks = processedTaskIds.length + skippedTaskIds.length
  
  // NEW QUEUE ARCHITECTURE: Navigation functions
  const moveToNextTask = useCallback(() => {
    if (queuePosition >= taskQueue.length - 1) return // At end of queue
    
    // Add current task to processed
    const currentTaskId = taskQueue[queuePosition]
    if (currentTaskId) {
      setProcessedTaskIds(prev => [...prev, currentTaskId])
    }
    
    // Move to next position
    setQueuePosition(prev => prev + 1)
    setTaskKey(prev => prev + 1) // Force re-render
  }, [queuePosition, taskQueue])
  
  const moveToPrevTask = useCallback(() => {
    if (queuePosition <= 0) return // At start of queue
    if (processedTaskIds.length === 0) return // No processed tasks
    
    // Move back one position
    setQueuePosition(prev => prev - 1)
    
    // Remove last processed task
    setProcessedTaskIds(prev => prev.slice(0, -1))
    setTaskKey(prev => prev + 1) // Force re-render
  }, [queuePosition, processedTaskIds.length])
  
  const skipCurrentTask = useCallback(() => {
    if (queuePosition >= taskQueue.length) return
    
    // Add current task to skipped
    const currentTaskId = taskQueue[queuePosition]
    if (currentTaskId) {
      setSkippedTaskIds(prev => [...prev, currentTaskId])
    }
    
    // Move to next position
    setQueuePosition(prev => prev + 1)
    setTaskKey(prev => prev + 1)
  }, [queuePosition, taskQueue])
  
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
          console.log(`Loaded collaborators data:`, {
            currentUser: collaboratorsData.currentUser,
            totalUsers: collaboratorsData.allUsers?.length || 0,
            projectsWithCollaborators: Object.keys(collaboratorsData.projectCollaborators || {}).length
          })
          
          // Pre-populate projectCollaborators using the actual mapping from collaborator_states
          const initialProjectCollaborators: Record<string, TodoistUser[]> = {}
          
          // For each project, find the active collaborators
          Object.entries(collaboratorsData.projectCollaborators || {}).forEach(([projectId, userIds]) => {
            // Map user IDs to actual user objects
            const projectUsers = (userIds as string[])
              .map(userId => collaboratorsData.allUsers.find(user => user.id === userId))
              .filter(Boolean) as TodoistUser[]
            
            initialProjectCollaborators[projectId] = projectUsers
            console.log(`Project ${projectId} has ${projectUsers.length} collaborators:`, 
              projectUsers.map(u => ({ id: u.id, name: u.name }))
            )
          })
          
          // For projects with no collaborators, set empty array
          projectsData.forEach((project: any) => {
            if (!(project.id in initialProjectCollaborators)) {
              initialProjectCollaborators[project.id] = []
            }
          })
          
          setProjectCollaborators(initialProjectCollaborators)
          console.log(`Pre-populated collaborators for ${Object.keys(initialProjectCollaborators).length} projects`)
        }
        
        console.log(`Loaded ${projectsData.length} projects`)
        
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
          console.log(`Loaded ${data.total} total tasks via ${data.message}`)
          setAllTasksGlobal(data.tasks)
          
          // Extract project metadata from special tasks
          metadata = extractProjectMetadata(data.tasks)
          setProjectMetadata(metadata)
          console.log('Extracted project metadata:', metadata)
          
          // Debug: Log projects with P1 priority
          const p1Projects = Object.entries(metadata)
            .filter(([_, meta]) => meta.priority === 4)
            .map(([projectId, meta]) => ({ projectId, ...meta }))
          console.log('Projects with P1 priority:', p1Projects)
          
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
            
            console.log(`Displayed ${inboxTasks.length} inbox tasks from sync data`)
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
            
            console.log('Project hierarchy built:', hierarchyData)
            setProjectHierarchy(hierarchyData)
          }
          
          // Build hierarchy after metadata is extracted
          buildProjectHierarchy(projectsData, metadata)
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
            console.log(`Filter "${mode.displayName}": Fetched ${filteredTasks.length} tasks from API`)
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
        console.log(`${mode.type} ${mode.displayName}: Found ${filteredTasks.length} tasks from ${allTasksGlobal.length} total tasks`)
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
        setProcessedTaskIds([])
        setSkippedTaskIds([])
        
        setTaskKey(prev => prev + 1) // Force TaskForm to re-render with new task
      } else {
        // Empty state
        setTaskQueue([])
        setQueuePosition(0)
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


  // Load tasks when processing mode or assignee filter changes
  useEffect(() => {
    if (processingMode.value && (processingMode.type === 'filter' || allTasksGlobal.length > 0)) {
      loadTasksForMode(processingMode)
    }
  }, [processingMode, loadTasksForMode, assigneeFilter])

  // Load suggestions when current task changes
  useEffect(() => {
    async function loadSuggestions() {
      // Check if current task is in inbox
      const currentProject = projects.find(p => p.id === currentTask?.projectId)
      const isInboxTask = currentProject?.isInboxProject || false
      
      console.log('Loading suggestions for task:', {
        hasTask: !!currentTask,
        taskId: currentTask?.id,
        projectId: currentTask?.projectId,
        isInboxTask,
        hasHierarchy: !!projectHierarchy
      })
      
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
        
        console.log('Raw suggestions from cache:', suggestions)
        console.log('Available projects:', projects.map(p => ({ id: p.id, name: p.name })))
        
        // Filter out inbox suggestions
        const filteredSuggestions = suggestions.filter(s => {
          const project = projects.find(p => p.id === s.projectId)
          console.log(`Checking suggestion ${s.projectName} (${s.projectId}):`, {
            found: !!project,
            isInbox: project?.isInboxProject
          })
          return project && !project.isInboxProject
        })
        
        console.log(`TaskProcessor: Setting suggestions for task ${currentTask.id}:`, filteredSuggestions)
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
          console.log('Found assignee from sync data:', assignee)
          setCurrentTaskAssignee(assignee)
        } else {
          // If we can't find the assignee in collaborators, create a placeholder
          console.log('Assignee not found in collaborators, creating placeholder')
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
  
  // Update task key when current task changes to force form re-render
  const moveToNext = useCallback(() => {
    // Simply advance the queue position
    setQueuePosition(prev => prev + 1)
    
    // Force form re-render when task changes
    setTaskKey(prevKey => prevKey + 1)
    
    // Prefetch suggestions for the next few tasks if we have project hierarchy and in inbox
    if (projectHierarchy && queuedTasks.length > queuePosition + 1) {
      const nextTaskId = queuedTasks[queuePosition + 1]
      const nextTask = masterTasks[nextTaskId]
      
      if (nextTask) {
        const inboxProject = projects.find(p => p.isInboxProject)
        const currentProject = projects.find(p => p.id === nextTask?.projectId)
        if (inboxProject && currentProject?.isInboxProject) {
          const upcomingTaskIds = queuedTasks.slice(queuePosition + 1, queuePosition + 4) // Preload next 3 tasks
          const upcomingTasks = upcomingTaskIds.map(id => masterTasks[id]).filter(Boolean)
          suggestionsCache.prefetchSuggestions(upcomingTasks, projectHierarchy).catch(error => {
            console.warn('Failed to prefetch suggestions for upcoming tasks:', error)
          })
        }
      }
    }
  }, [projectHierarchy, queuedTasks, queuePosition, masterTasks, projects])

  // NEW QUEUE ARCHITECTURE: Only update master store, queue unchanged
  const autoSaveTask = useCallback(async (taskId: string, updates: TaskUpdate) => {
    try {
      console.log('TaskProcessor.autoSaveTask called with:', { taskId, updates })
      
      // Update the task via API
      const response = await fetch(`/api/todoist/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Response error:', errorData)
        throw new Error(`Failed to update task: ${errorData.error || response.statusText}`)
      }

      const responseData = await response.json()
      console.log('API Response data:', responseData)
      
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

  const handleNext = useCallback(() => {
    // Use new architecture navigation
    moveToNextTask()
  }, [moveToNextTask])

  const handlePrioritySelect = useCallback(async (priority: 1 | 2 | 3 | 4) => {
    setShowPriorityOverlay(false) // Close immediately
    
    if (currentTask) {
      try {
        // Update master store directly - no need for UI state manipulation
        await autoSaveTask(currentTask.id, { priority })
      } catch (err) {
        // Error handled in autoSaveTask
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
    if (!currentTask) return
    
    setProcessedTaskIds(prev => [...prev, currentTask.id])
    moveToNext()
  }, [currentTask, moveToNext])

  const navigateToPrevTask = useCallback(() => {
    if (processedTaskIds.length === 0) return
    
    // Simply move back one position in the queue
    setQueuePosition(prev => Math.max(0, prev - 1))
    
    // Remove the last processed task ID
    setProcessedTaskIds(prev => prev.slice(0, -1))
    
    setTaskKey(prev => prev + 1) // Force re-render
  }, [processedTaskIds])

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
        // Clear the do date
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

  const handleArchiveTask = useCallback(async () => {
    if (!currentTask) return
    
    // Close the overlay immediately to prevent UI issues
    setShowArchiveConfirm(false)
    
    // Store the current task ID before moving to next
    const taskId = currentTask.id
    
    // Move to next task immediately for better UX
    setProcessedTaskIds(prev => [...prev, taskId])
    moveToNext()
    
    // Show optimistic success message
    setToast({ message: 'Task archived', type: 'success' })
    
    // Handle the API request in the background
    try {
      const response = await fetch(`/api/todoist/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to archive task')
      }
    } catch (err) {
      console.error('Error archiving task:', err)
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to archive task', 
        type: 'error' 
      })
    }
  }, [currentTask, moveToNext])

  const handleCompleteTask = useCallback(async () => {
    if (!currentTask) return
    
    // Close the overlay immediately to prevent UI issues
    setShowCompleteConfirm(false)
    
    // Store the current task ID before moving to next
    const taskId = currentTask.id
    
    // Move to next task immediately for better UX
    setProcessedTaskIds(prev => [...prev, taskId])
    moveToNext()
    
    // Show optimistic success message
    setToast({ message: 'Task completed', type: 'success' })
    
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
  }, [currentTask, moveToNext])

  const skipTask = useCallback(() => {
    if (!currentTask) return
    
    setSkippedTaskIds(prev => [...prev, currentTask.id])
    moveToNext()
  }, [currentTask, moveToNext])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          setShowArchiveConfirm(true)
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
        case 'Escape':
        case '`':
          setShowShortcuts(false)
          setShowPriorityOverlay(false)
          setShowProjectOverlay(false)
          setShowLabelOverlay(false)
          setShowScheduledOverlay(false)
          setShowDeadlineOverlay(false)
          setShowArchiveConfirm(false)
          setShowCompleteConfirm(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateToNextTask, navigateToPrevTask, showShortcuts, showPriorityOverlay, showProjectOverlay, showLabelOverlay, showScheduledOverlay, showDeadlineOverlay, showAssigneeOverlay, hasCollaboratorsForCurrentProject])

  // Handle Enter key for confirmation dialogs
  useEffect(() => {
    const handleConfirmationKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (showArchiveConfirm) {
          e.preventDefault()
          handleArchiveTask()
        } else if (showCompleteConfirm) {
          e.preventDefault()
          handleCompleteTask()
        }
      }
    }

    if (showArchiveConfirm || showCompleteConfirm) {
      window.addEventListener('keydown', handleConfirmationKeyDown)
      return () => window.removeEventListener('keydown', handleConfirmationKeyDown)
    }
  }, [showArchiveConfirm, showCompleteConfirm, handleArchiveTask, handleCompleteTask])

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
                  <div className="text-sm text-gray-500">
                    Processed: {state.processedTasks.length} • Skipped: {state.skippedTasks.length}
                  </div>
                )}
                <button
                  onClick={() => loadTasksForMode(processingMode)}
                  className="mt-4 px-4 py-2 bg-todoist-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Refresh Tasks
                </button>
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
              current={completedTasks + 1}
              total={totalTasks}
              progress={progress}
            />
          )}
        </div>

        {/* Main Processing Area */}
        {currentTask && !loadingTasks && (
          <div className="space-y-6">
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
              onPrevious={moveToPrevTask}
              canGoNext={queuedTasks.length > 0}
              canGoPrevious={processedTaskIds.length > 0}
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

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && currentTask && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowArchiveConfirm(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Archive Task?</h3>
            <p className="text-gray-600 mb-4">
              This will remove the task from your active list. You can still find it in your completed tasks.
            </p>
            <p className="text-sm font-medium text-gray-800 mb-6 p-3 bg-gray-50 rounded">
              "{currentTask.content}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveTask}
                className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
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
              "{currentTask.content}"
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}