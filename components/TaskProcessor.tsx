'use client'

import { useState, useEffect, useCallback } from 'react'
import { TodoistTask, TodoistProject, TodoistLabel, ProcessingState, TaskUpdate } from '@/lib/types'
import { generateMockSuggestions } from '@/lib/mock-data'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import KeyboardShortcuts from './KeyboardShortcuts'
import ProgressIndicator from './ProgressIndicator'
import ProjectSwitcher from './ProjectSwitcher'
import PriorityOverlay from './PriorityOverlay'

export default function TaskProcessor() {
  const [state, setState] = useState<ProcessingState>({
    currentTask: null,
    queuedTasks: [],
    processedTasks: [],
    skippedTasks: [],
  })
  
  const [projects, setProjects] = useState<TodoistProject[]>([])
  const [labels, setLabels] = useState<TodoistLabel[]>([])
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [allTasks, setAllTasks] = useState<TodoistTask[]>([])
  const [taskKey, setTaskKey] = useState(0) // Force re-render of TaskForm
  const [showPriorityOverlay, setShowPriorityOverlay] = useState(false)

  // Load initial data (projects and labels)
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch projects and labels
        const [projectsRes, labelsRes] = await Promise.all([
          fetch('/api/todoist/projects'),
          fetch('/api/todoist/labels'),
        ])

        if (!projectsRes.ok || !labelsRes.ok) {
          throw new Error('Failed to fetch data from Todoist API')
        }

        const [projectsData, labelsData] = await Promise.all([
          projectsRes.json(),
          labelsRes.json(),
        ])

        setProjects(projectsData)
        setLabels(labelsData)
        
        // Set default to actual inbox project if it exists
        const inboxProject = projectsData.find((p: any) => p.isInboxProject)
        setSelectedProjectId(inboxProject?.id || 'inbox')
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load tasks for selected project
  const loadProjectTasks = useCallback(async (projectId: string) => {
    if (!projectId) return
    
    try {
      setLoadingTasks(true)
      setError(null)
      console.log('Loading tasks for project:', projectId)
      
      const tasksRes = await fetch(`/api/todoist/tasks?projectId=${projectId}`)
      
      if (!tasksRes.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const tasksData = await tasksRes.json()
      console.log('Loaded tasks:', tasksData)
      setAllTasks(tasksData)

      // Set up task processing queue and force form re-render
      if (tasksData.length > 0) {
        setState({
          currentTask: tasksData[0],
          queuedTasks: tasksData.slice(1),
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
    } catch (err) {
      console.error('Error loading project tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  // Load tasks when project changes
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId) {
      loadProjectTasks(selectedProjectId)
    }
  }, [selectedProjectId, projects.length, loadProjectTasks])
  
  // Update task key when current task changes to force form re-render
  const moveToNext = useCallback(() => {
    setState(prev => {
      const nextTask = prev.queuedTasks[0] || null
      const remainingQueue = prev.queuedTasks.slice(1)
      
      // Force form re-render when task changes
      if (nextTask) {
        setTaskKey(prevKey => prevKey + 1)
      }
      
      return {
        ...prev,
        currentTask: nextTask,
        queuedTasks: remainingQueue,
      }
    })
  }, [])

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
      setError(err instanceof Error ? err.message : 'Failed to auto-save task')
    }
  }, [])

  const handleContentChange = useCallback(async (newContent: string) => {
    if (state.currentTask) {
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

  const handlePrioritySelect = useCallback((priority: 1 | 2 | 3 | 4) => {
    if (state.currentTask) {
      // Update the task immediately in the UI
      setState(prev => ({
        ...prev,
        currentTask: prev.currentTask ? { ...prev.currentTask, priority } : null
      }))
      
      // Queue the auto-save
      autoSaveTask(state.currentTask.id, { priority })
    }
    setShowPriorityOverlay(false)
  }, [state.currentTask, autoSaveTask])

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
      // Don't handle shortcuts when priority overlay is open - it handles its own keys
      if (showPriorityOverlay) {
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
        case 'Enter':
          e.preventDefault()
          handleNext()
          break
        case '?':
          e.preventDefault()
          setShowShortcuts(!showShortcuts)
          break
        case 'Escape':
          setShowShortcuts(false)
          setShowPriorityOverlay(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, showShortcuts, showPriorityOverlay])

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
    const projectName = selectedProjectId === 'inbox' ? 'Inbox' : 
                       projects.find(p => p.id === selectedProjectId)?.name || 'Project'
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Task Processor</h1>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Shortcuts <span className="kbd">?</span>
              </button>
            </div>
            
            {/* Project Switcher */}
            <ProjectSwitcher
              projects={projects}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              taskCount={totalTasks}
            />
            
            {/* Loading State for Task Switching */}
            {loadingTasks && (
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
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
                  {totalTasks === 0 ? `${projectName} is Empty` : `${projectName} Complete!`}
                </h1>
                <p className="text-gray-600 mb-4">
                  {totalTasks === 0 
                    ? `No tasks found in ${projectName}. Try selecting a different project.`
                    : 'All tasks have been processed.'
                  }
                </p>
                {totalTasks > 0 && (
                  <div className="text-sm text-gray-500">
                    Processed: {state.processedTasks.length} • Skipped: {state.skippedTasks.length}
                  </div>
                )}
                <button
                  onClick={() => loadProjectTasks(selectedProjectId)}
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
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Shortcuts <span className="kbd">?</span>
            </button>
          </div>
          
          {/* Project Switcher */}
          <ProjectSwitcher
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
            taskCount={totalTasks}
          />
          
          {/* Loading State for Task Switching */}
          {loadingTasks && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
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
              onContentChange={handleContentChange}
            />

            {/* Task Form Controls */}
            <TaskForm
              key={taskKey} // Force re-render when task changes
              task={state.currentTask}
              projects={projects}
              labels={labels}
              suggestions={generateMockSuggestions(state.currentTask.content)}
              onAutoSave={(updates) => autoSaveTask(state.currentTask!.id, updates)}
              onNext={handleNext}
            />
          </div>
        )}

        {/* Queue Preview */}
        {state.queuedTasks.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Next in queue ({state.queuedTasks.length} remaining)
            </h3>
            <div className="space-y-2">
              {state.queuedTasks.slice(0, 3).map((task, index) => (
                <div key={task.id} className="text-sm text-gray-600 truncate">
                  {index + 1}. {task.content}
                </div>
              ))}
              {state.queuedTasks.length > 3 && (
                <div className="text-sm text-gray-400">
                  + {state.queuedTasks.length - 3} more...
                </div>
              )}
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
    </div>
  )
}