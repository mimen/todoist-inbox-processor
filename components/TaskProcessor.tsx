'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TodoistTask, TodoistProject, TodoistLabel, ProcessingState, TaskUpdate, TodoistUser } from '@/lib/types'
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
      
      // The task's due date IS the project's due date
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
import { AssigneeFilterType } from './AssigneeFilter'

export default function TaskProcessor() {
  const [state, setState] = useState<ProcessingState>({
    currentTask: null,
    queuedTasks: [],
    processedTasks: [],
    skippedTasks: [],
  })
  
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
  const [allTasks, setAllTasks] = useState<TodoistTask[]>([])
  const [allTasksGlobal, setAllTasksGlobal] = useState<TodoistTask[]>([]) // All tasks across all projects
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
  const [projectCollaborators, setProjectCollaborators] = useState<Record<string, TodoistUser[]>>({})
  const [currentTaskAssignee, setCurrentTaskAssignee] = useState<TodoistUser | undefined>(undefined)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterType>('all')
  const currentUserId = '13801296' // This should match the user ID from the MCP config

  // Load initial data (projects and labels)
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch critical data first (projects, labels, and filters)
        // Use sync API for projects to ensure consistent IDs with tasks
        const [projectsRes, labelsRes, filtersRes] = await Promise.all([
          fetch('/api/todoist/projects-sync'),
          fetch('/api/todoist/labels'),
          fetch('/api/todoist/filters'),
        ])

        if (!projectsRes.ok || !labelsRes.ok) {
          throw new Error('Failed to fetch data from Todoist API')
        }

        const [projectsResponse, labelsData, filtersData] = await Promise.all([
          projectsRes.json(),
          labelsRes.json(),
          filtersRes.ok ? filtersRes.json() : [],
        ])
        
        // Extract projects from response
        const projectsData = projectsResponse.projects || projectsResponse

        setProjects(projectsData)
        setLabels(labelsData)
        setFilters(filtersData)
        
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
        if (allTasksRes.ok) {
          const data = await allTasksRes.json()
          console.log(`Loaded ${data.total} total tasks via ${data.message}`)
          setAllTasksGlobal(data.tasks)
          
          // Extract project metadata from special tasks
          const metadata = extractProjectMetadata(data.tasks)
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
            
            setAllTasks(inboxTasks)
            
            if (inboxTasks.length > 0) {
              setState({
                currentTask: inboxTasks[0],
                queuedTasks: inboxTasks.slice(1),
                processedTasks: [],
                skippedTasks: [],
              })
              setTaskKey(prev => prev + 1)
            }
            
            console.log(`Displayed ${inboxTasks.length} inbox tasks from sync data`)
          }
        }
        
        // Build project hierarchy from already-loaded data
        const buildProjectHierarchy = () => {
          // Add metadata to projects
          const projectsWithMetadata = projectsData.map((project: any) => ({
            ...project,
            description: metadata[project.id]?.description || '',
            priority: metadata[project.id]?.priority || null,
            due: metadata[project.id]?.due || null,
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
        buildProjectHierarchy()
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load tasks for selected mode
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
      
      setAllTasks(filteredTasks)

      // Set up task processing queue and force form re-render
      if (filteredTasks.length > 0) {
        setState({
          currentTask: filteredTasks[0],
          queuedTasks: filteredTasks.slice(1),
          processedTasks: [],
          skippedTasks: [],
        })
        setTaskKey(prev => prev + 1) // Force TaskForm to re-render with new task
      } else {
        setState({
          currentTask: null,
          queuedTasks: [],
          processedTasks: [],
          skippedTasks: [],
        })
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
  }, [allTasksGlobal, projectHierarchy, setToast, assigneeFilter, currentUserId, projectMetadata])


  // Load tasks when processing mode or assignee filter changes
  useEffect(() => {
    if (processingMode.value && (processingMode.type === 'filter' || allTasksGlobal.length > 0)) {
      loadTasksForMode(processingMode)
    }
  }, [processingMode, allTasksGlobal.length, loadTasksForMode, assigneeFilter])

  // Load suggestions when current task changes
  useEffect(() => {
    async function loadSuggestions() {
      // Check if current task is in inbox
      const currentProject = projects.find(p => p.id === state.currentTask?.projectId)
      const isInboxTask = currentProject?.isInboxProject || false
      
      console.log('Loading suggestions for task:', {
        hasTask: !!state.currentTask,
        taskId: state.currentTask?.id,
        projectId: state.currentTask?.projectId,
        isInboxTask,
        hasHierarchy: !!projectHierarchy
      })
      
      // Only generate suggestions for inbox tasks
      if (!state.currentTask || !projectHierarchy || !isInboxTask) {
        setCurrentTaskSuggestions([])
        return
      }

      try {
        const suggestions = await suggestionsCache.generateSuggestions(
          state.currentTask.id,
          state.currentTask.content,
          state.currentTask.description || '',
          projectHierarchy,
          state.currentTask.projectId
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
        
        console.log(`TaskProcessor: Setting suggestions for task ${state.currentTask.id}:`, filteredSuggestions)
        setCurrentTaskSuggestions(filteredSuggestions)
      } catch (error) {
        console.error('Error loading suggestions:', error)
        setCurrentTaskSuggestions([])
      }
    }

    loadSuggestions()
  }, [state.currentTask?.id, state.currentTask?.content, state.currentTask?.description, state.currentTask?.projectId, projectHierarchy, projects])
  
  // Load collaborators and assignee when current task changes
  useEffect(() => {
    async function loadAssigneeData() {
      if (!state.currentTask) {
        setCurrentTaskAssignee(undefined)
        return
      }

      // Load collaborators for the project if not already cached
      const projectId = state.currentTask.projectId
      console.log('Loading assignee data for task:', {
        taskId: state.currentTask.id,
        projectId,
        assigneeId: state.currentTask.assigneeId
      })
      
      if (projectId && !projectCollaborators[projectId]) {
        try {
          // Include current assignee in the request if they exist
          const url = state.currentTask.assigneeId 
            ? `/api/todoist/projects/${projectId}/collaborators?includeAssignee=${state.currentTask.assigneeId}`
            : `/api/todoist/projects/${projectId}/collaborators`
            
          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            const collaborators = data.users || data // Handle both old and new response formats
            console.log(`Fetched ${collaborators.length} collaborators for project ${projectId}:`, collaborators)
            console.log('Project metadata:', {
              isPersonalProject: data.isPersonalProject,
              hasCollaborators: data.hasCollaborators
            })
            setProjectCollaborators(prev => ({
              ...prev,
              [projectId]: collaborators
            }))
          } else {
            console.error('Failed to fetch collaborators, status:', response.status)
          }
        } catch (error) {
          console.error('Error fetching project collaborators:', error)
        }
      }

      // Find the assignee from collaborators
      if (state.currentTask.assigneeId && projectCollaborators[projectId]) {
        console.log('Looking for assignee:', {
          assigneeId: state.currentTask.assigneeId,
          assigneeIdType: typeof state.currentTask.assigneeId,
          collaborators: projectCollaborators[projectId].map(c => ({
            id: c.id,
            idType: typeof c.id,
            name: c.name
          }))
        })
        
        // Try to find assignee with string comparison
        const assignee = projectCollaborators[projectId].find(
          collab => String(collab.id) === String(state.currentTask?.assigneeId)
        )
        
        if (assignee) {
          console.log('Found assignee:', assignee)
          setCurrentTaskAssignee(assignee)
        } else {
          // If we can't find the assignee in collaborators, create a placeholder
          console.log('Assignee not found in collaborators, creating placeholder')
          setCurrentTaskAssignee({
            id: state.currentTask.assigneeId,
            name: `User ${state.currentTask.assigneeId}`,
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
  }, [state.currentTask?.id, state.currentTask?.assigneeId, state.currentTask?.projectId, projectCollaborators])
  
  // Update task key when current task changes to force form re-render
  const moveToNext = useCallback(() => {
    setState(prev => {
      const nextTask = prev.queuedTasks[0] || null
      const remainingQueue = prev.queuedTasks.slice(1)
      
      // Force form re-render when task changes
      if (nextTask) {
        setTaskKey(prevKey => prevKey + 1)
        
        // Prefetch suggestions for the next few tasks if we have project hierarchy and in inbox
        if (projectHierarchy && remainingQueue.length > 0) {
          const inboxProject = projects.find(p => p.isInboxProject)
          const currentProject = projects.find(p => p.id === nextTask?.projectId)
          if (inboxProject && currentProject?.isInboxProject) {
            const tasksToPreload = remainingQueue.slice(0, 3) // Preload next 3 tasks
            suggestionsCache.prefetchSuggestions(tasksToPreload, projectHierarchy).catch(error => {
              console.warn('Failed to prefetch suggestions for upcoming tasks:', error)
            })
          }
        }
      }
      
      return {
        ...prev,
        currentTask: nextTask,
        queuedTasks: remainingQueue,
      }
    })
  }, [projectHierarchy])

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
    } catch (err) {
      console.error('Error auto-saving task:', err)
      // Show toast instead of setting error state
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to save changes', 
        type: 'error' 
      })
      // Re-throw to allow handlers to revert changes
      throw err
    }
  }, [])

  const handleContentChange = useCallback(async (newContent: string) => {
    if (state.currentTask) {
      // Invalidate suggestions cache since content changed
      suggestionsCache.invalidateTask(state.currentTask.id)
      await autoSaveTask(state.currentTask.id, { content: newContent })
    }
  }, [state.currentTask, autoSaveTask])

  const handleNext = useCallback(() => {
    if (!state.currentTask) return
    
    setState(prev => ({
      ...prev,
      processedTasks: [...prev.processedTasks, prev.currentTask!.id],
    }))
    
    moveToNext()
  }, [state.currentTask, moveToNext])

  const handlePrioritySelect = useCallback(async (priority: 1 | 2 | 3 | 4) => {
    setShowPriorityOverlay(false) // Close immediately
    
    if (state.currentTask) {
      const originalPriority = state.currentTask.priority
      
      // Update the task immediately in the UI
      setState(prev => ({
        ...prev,
        currentTask: prev.currentTask ? { ...prev.currentTask, priority } : null
      }))
      
      try {
        // Queue the auto-save
        await autoSaveTask(state.currentTask.id, { priority })
      } catch (err) {
        // Revert on error
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? { ...prev.currentTask, priority: originalPriority } : null
        }))
      }
    }
  }, [state.currentTask, autoSaveTask])

  const handleProjectSelect = useCallback(async (projectId: string) => {
    setShowProjectOverlay(false) // Close immediately
    
    if (state.currentTask) {
      const originalProjectId = state.currentTask.projectId
      
      // Update the task immediately in the UI
      setState(prev => ({
        ...prev,
        currentTask: prev.currentTask ? { ...prev.currentTask, projectId } : null
      }))
      
      try {
        // Queue the auto-save
        await autoSaveTask(state.currentTask.id, { projectId })
      } catch (err) {
        // Revert on error
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? { ...prev.currentTask, projectId: originalProjectId } : null
        }))
      }
    }
  }, [state.currentTask, autoSaveTask])

  const handleLabelsChange = useCallback(async (labels: string[]) => {
    if (state.currentTask) {
      const originalLabels = state.currentTask.labels
      
      // Update the task immediately in the UI
      setState(prev => ({
        ...prev,
        currentTask: prev.currentTask ? { ...prev.currentTask, labels } : null
      }))
      
      try {
        // Queue the auto-save
        await autoSaveTask(state.currentTask.id, { labels })
      } catch (err) {
        // Revert on error
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? { ...prev.currentTask, labels: originalLabels } : null
        }))
      }
    }
  }, [state.currentTask, autoSaveTask])

  const handleDescriptionChange = useCallback(async (newDescription: string) => {
    if (state.currentTask) {
      // Invalidate suggestions cache since description changed
      suggestionsCache.invalidateTask(state.currentTask.id)
      
      // Update the task immediately in the UI
      setState(prev => ({
        ...prev,
        currentTask: prev.currentTask ? { ...prev.currentTask, description: newDescription } : null
      }))
      
      await autoSaveTask(state.currentTask.id, { description: newDescription })
    }
  }, [state.currentTask, autoSaveTask])

  const handleLabelRemove = useCallback((labelName: string) => {
    if (state.currentTask) {
      const newLabels = state.currentTask.labels.filter(l => l !== labelName)
      handleLabelsChange(newLabels)
    }
  }, [state.currentTask, handleLabelsChange])

  const navigateToNextTask = useCallback(() => {
    if (!state.currentTask) return
    
    setState(prev => ({
      ...prev,
      processedTasks: [...prev.processedTasks, prev.currentTask!.id],
    }))
    
    moveToNext()
  }, [state.currentTask, moveToNext])

  const navigateToPrevTask = useCallback(() => {
    if (state.processedTasks.length === 0) return
    
    // Move the last processed task back to current
    setState(prev => {
      const lastProcessedId = prev.processedTasks[prev.processedTasks.length - 1]
      const lastProcessedTask = allTasks.find(task => task.id === lastProcessedId)
      
      if (!lastProcessedTask) return prev
      
      return {
        ...prev,
        currentTask: lastProcessedTask,
        queuedTasks: prev.currentTask ? [prev.currentTask, ...prev.queuedTasks] : prev.queuedTasks,
        processedTasks: prev.processedTasks.slice(0, -1)
      }
    })
    
    setTaskKey(prev => prev + 1) // Force re-render
  }, [state.processedTasks, allTasks])

  const handleScheduledDateChange = useCallback(async (dateString: string) => {
    if (state.currentTask) {
      try {
        // Update UI state immediately
        if (dateString) {
          setState(prev => ({
            ...prev,
            currentTask: prev.currentTask ? { 
              ...prev.currentTask, 
              due: { 
                date: dateString, 
                string: dateString,
                recurring: false 
              }
            } : null
          }))
        } else {
          // Clear the due date
          setState(prev => ({
            ...prev,
            currentTask: prev.currentTask ? { 
              ...prev.currentTask, 
              due: undefined 
            } : null
          }))
        }
        
        // Then update the API
        const updates = { dueString: dateString }
        await autoSaveTask(state.currentTask.id, updates)
      } catch (error) {
        console.error('Error updating scheduled date:', error)
        // Revert the UI state on error
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? { 
            ...prev.currentTask, 
            due: state.currentTask!.due 
          } : null
        }))
      }
    }
  }, [state.currentTask, autoSaveTask])

  const handleDeadlineChange = useCallback(async (dateString: string) => {
    if (state.currentTask) {
      try {
        // Update UI state immediately
        if (dateString) {
          setState(prev => ({
            ...prev,
            currentTask: prev.currentTask ? { 
              ...prev.currentTask, 
              deadline: { 
                date: dateString, 
                string: dateString 
              }
            } : null
          }))
        } else {
          // Clear the deadline
          setState(prev => ({
            ...prev,
            currentTask: prev.currentTask ? { 
              ...prev.currentTask, 
              deadline: undefined 
            } : null
          }))
        }
        
        // Then update the API
        const updates = { deadline: dateString }
        await autoSaveTask(state.currentTask.id, updates)
      } catch (error) {
        console.error('Error updating deadline:', error)
        // Revert the UI state on error
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? { 
            ...prev.currentTask, 
            deadline: state.currentTask!.deadline 
          } : null
        }))
      }
    }
  }, [state.currentTask, autoSaveTask])

  const handleAssigneeSelect = useCallback(async (userId: string | null) => {
    setShowAssigneeOverlay(false) // Close immediately
    
    if (state.currentTask) {
      const originalAssigneeId = state.currentTask.assigneeId
      
      // Update the task immediately in the UI
      setState(prev => ({
        ...prev,
        currentTask: prev.currentTask ? { ...prev.currentTask, assigneeId: userId || undefined } : null
      }))
      
      // Update the current assignee display
      if (userId && projectCollaborators[state.currentTask.projectId]) {
        const newAssignee = projectCollaborators[state.currentTask.projectId].find(
          collab => String(collab.id) === String(userId)
        )
        setCurrentTaskAssignee(newAssignee)
      } else {
        setCurrentTaskAssignee(undefined)
      }
      
      try {
        // Queue the auto-save
        await autoSaveTask(state.currentTask.id, { assigneeId: userId || undefined })
      } catch (err) {
        // Revert on error
        setState(prev => ({
          ...prev,
          currentTask: prev.currentTask ? { ...prev.currentTask, assigneeId: originalAssigneeId } : null
        }))
        
        // Revert assignee display
        if (originalAssigneeId && projectCollaborators[state.currentTask.projectId]) {
          const originalAssignee = projectCollaborators[state.currentTask.projectId].find(
            collab => String(collab.id) === String(originalAssigneeId)
          )
          setCurrentTaskAssignee(originalAssignee)
        } else {
          setCurrentTaskAssignee(undefined)
        }
      }
    }
  }, [state.currentTask, autoSaveTask, projectCollaborators])

  const handleArchiveTask = useCallback(async () => {
    if (!state.currentTask) return
    
    // Close the overlay immediately to prevent UI issues
    setShowArchiveConfirm(false)
    
    // Store the current task ID before moving to next
    const taskId = state.currentTask.id
    
    // Move to next task immediately for better UX
    setState(prev => ({
      ...prev,
      processedTasks: [...prev.processedTasks, prev.currentTask!.id],
    }))
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
  }, [state.currentTask, moveToNext])

  const handleCompleteTask = useCallback(async () => {
    if (!state.currentTask) return
    
    // Close the overlay immediately to prevent UI issues
    setShowCompleteConfirm(false)
    
    // Store the current task ID before moving to next
    const taskId = state.currentTask.id
    
    // Move to next task immediately for better UX
    setState(prev => ({
      ...prev,
      processedTasks: [...prev.processedTasks, prev.currentTask!.id],
    }))
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
  }, [state.currentTask, moveToNext])

  const skipTask = useCallback(() => {
    if (!state.currentTask) return
    
    setState(prev => ({
      ...prev,
      skippedTasks: [...prev.skippedTasks, prev.currentTask!.id],
    }))
    
    moveToNext()
  }, [state.currentTask, moveToNext])

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
          document.querySelector('.dropdown-open')) {
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
          setShowAssigneeOverlay(true)
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
  }, [navigateToNextTask, navigateToPrevTask, showShortcuts, showPriorityOverlay, showProjectOverlay, showLabelOverlay, showScheduledOverlay, showDeadlineOverlay])

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

  const totalTasks = allTasks.length
  const completedTasks = state.processedTasks.length + state.skippedTasks.length
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

  if (!state.currentTask && state.queuedTasks.length === 0 && !loading) {
    const displayName = processingMode.displayName || 'Tasks'
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Task Processor</h1>
              <div className="flex items-center gap-3">
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
              taskCounts={getTaskCountsForProjects(allTasksGlobal, projects.map(p => p.id))}
              labels={labels}
              projectMetadata={projectMetadata}
              assigneeFilter={assigneeFilter}
              onAssigneeFilterChange={setAssigneeFilter}
              currentUserId={currentUserId}
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
            taskCounts={getTaskCountsForProjects(allTasksGlobal, projects.map(p => p.id))}
            labels={labels}
            projectMetadata={projectMetadata}
            assigneeFilter={assigneeFilter}
            onAssigneeFilterChange={setAssigneeFilter}
            currentUserId={currentUserId}
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
        {state.currentTask && !loadingTasks && (
          <div className="space-y-6">
            {/* Full-width Task Card */}
            <TaskCard 
              task={state.currentTask} 
              projects={projects} 
              labels={labels} 
              assignee={currentTaskAssignee}
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
              project={projects.find(p => p.id === state.currentTask.projectId)}
              metadata={projectMetadata[state.currentTask.projectId]}
              allProjects={projects}
              className="animate-fade-in"
            />

            {/* Project Suggestions */}
            {currentTaskSuggestions.length > 0 && (
              <ProjectSuggestions
                task={state.currentTask}
                projects={projects}
                suggestions={currentTaskSuggestions}
                onProjectSelect={handleProjectSelect}
              />
            )}

            {/* Task Form Controls */}
            <TaskForm
              key={taskKey} // Force re-render when task changes
              task={state.currentTask}
              projects={projects}
              labels={labels}
              suggestions={generateMockSuggestions(state.currentTask.content)}
              onAutoSave={(updates) => autoSaveTask(state.currentTask!.id, updates)}
              onNext={navigateToNextTask}
              onPrevious={navigateToPrevTask}
              canGoNext={state.queuedTasks.length > 0}
              canGoPrevious={state.processedTasks.length > 0}
            />
          </div>
        )}

        {/* Queue Preview */}
        {state.queuedTasks.length > 0 && (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-full max-w-2xl p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
                Next in queue ({state.queuedTasks.length} remaining)
              </h3>
              <div className="space-y-2">
                {state.queuedTasks.slice(0, 10).map((task, index) => {
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
                {state.queuedTasks.length > 10 && (
                  <div className="text-sm text-gray-400 text-center" style={{ opacity: 0.3 }}>
                    + {state.queuedTasks.length - 10} more...
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
      {state.currentTask && (
        <PriorityOverlay
          currentPriority={state.currentTask.priority}
          onPrioritySelect={handlePrioritySelect}
          onClose={() => setShowPriorityOverlay(false)}
          isVisible={showPriorityOverlay}
        />
      )}

      {/* Project Selection Overlay */}
      {state.currentTask && (
        <ProjectSelectionOverlay
          key={`project-overlay-${state.currentTask.id}`}
          projects={projects}
          currentProjectId={state.currentTask.projectId}
          currentTask={state.currentTask}
          suggestions={currentTaskSuggestions}
          onProjectSelect={handleProjectSelect}
          onClose={() => setShowProjectOverlay(false)}
          isVisible={showProjectOverlay}
        />
      )}

      {/* Label Selection Overlay */}
      {state.currentTask && (
        <LabelSelectionOverlay
          labels={labels}
          currentTask={state.currentTask}
          onLabelsChange={handleLabelsChange}
          onClose={() => setShowLabelOverlay(false)}
          isVisible={showLabelOverlay}
        />
      )}

      {/* Scheduled Date Selector */}
      {state.currentTask && (
        <ScheduledDateSelector
          currentTask={state.currentTask}
          onScheduledDateChange={handleScheduledDateChange}
          onClose={() => setShowScheduledOverlay(false)}
          isVisible={showScheduledOverlay}
        />
      )}

      {/* Deadline Selector */}
      {state.currentTask && (
        <DeadlineSelector
          currentTask={state.currentTask}
          onDeadlineChange={handleDeadlineChange}
          onClose={() => setShowDeadlineOverlay(false)}
          isVisible={showDeadlineOverlay}
        />
      )}

      {/* Assignee Selection Overlay */}
      {state.currentTask && (
        <AssigneeSelectionOverlay
          isVisible={showAssigneeOverlay}
          onClose={() => setShowAssigneeOverlay(false)}
          onAssigneeSelect={handleAssigneeSelect}
          currentAssigneeId={state.currentTask.assigneeId}
          collaborators={projectCollaborators[state.currentTask.projectId] || []}
        />
      )}

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && state.currentTask && (
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
              "{state.currentTask.content}"
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
      {showCompleteConfirm && state.currentTask && (
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
              "{state.currentTask.content}"
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