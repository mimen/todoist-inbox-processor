import { useState, useMemo, useCallback, useEffect } from 'react'
import { TodoistTask } from '@/lib/types'
import { ProcessingMode } from '@/types/processing-mode'

interface QueueManagementState {
  // Core queue state
  masterTasks: Record<string, TodoistTask>
  taskQueue: string[]
  queuePosition: number
  activeQueuePosition: number
  processedTaskIds: string[]
  skippedTaskIds: string[]
  slidingOutTaskIds: string[]
  originalProjectIds: Record<string, string> // Track original project IDs for queue tasks
  
  // Derived values
  activeQueue: string[]
  currentTask: TodoistTask | null
  queuedTasks: TodoistTask[]
  totalTasks: number
  completedTasks: number
}

interface QueueManagementActions {
  // Task management
  setMasterTasks: React.Dispatch<React.SetStateAction<Record<string, TodoistTask>>>
  updateMasterTask: (taskId: string, updates: Partial<TodoistTask>) => void
  
  // Queue management
  setTaskQueue: React.Dispatch<React.SetStateAction<string[]>>
  resetQueue: (tasks: TodoistTask[], preserveProcessedTasks?: boolean) => void
  clearQueue: () => void
  
  // Position management
  setQueuePosition: React.Dispatch<React.SetStateAction<number>>
  setActiveQueuePosition: React.Dispatch<React.SetStateAction<number>>
  navigateToNextTask: () => void
  navigateToPrevTask: () => void
  
  // Task processing
  markTaskAsProcessed: (taskId: string) => void
  markTaskAsSkipped: (taskId: string) => void
  setProcessedTaskIds: React.Dispatch<React.SetStateAction<string[]>>
  setSkippedTaskIds: React.Dispatch<React.SetStateAction<string[]>>
  
  // Animation helpers
  setSlidingOutTaskIds: React.Dispatch<React.SetStateAction<string[]>>
  addSlidingOutTask: (taskId: string) => void
  removeSlidingOutTask: (taskId: string) => void
}

export interface UseQueueManagementReturn extends QueueManagementState, QueueManagementActions {}

export function useQueueManagement(): UseQueueManagementReturn {
  // Core state
  const [masterTasks, setMasterTasks] = useState<Record<string, TodoistTask>>({})
  const [taskQueue, setTaskQueue] = useState<string[]>([])
  const [queuePosition, setQueuePosition] = useState(0)
  const [activeQueuePosition, setActiveQueuePosition] = useState(0)
  const [processedTaskIds, setProcessedTaskIds] = useState<string[]>([])
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([])
  const [slidingOutTaskIds, setSlidingOutTaskIds] = useState<string[]>([])
  const [originalProjectIds, setOriginalProjectIds] = useState<Record<string, string>>({})
  
  // Derived state
  const activeQueue = useMemo(() => {
    return taskQueue.filter(taskId => !processedTaskIds.includes(taskId))
  }, [taskQueue, processedTaskIds])
  
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
  
  // Actions
  const updateMasterTask = useCallback((taskId: string, updates: Partial<TodoistTask>) => {
    setMasterTasks(prev => {
      const existingTask = prev[taskId]
      if (!existingTask) return prev
      
      return {
        ...prev,
        [taskId]: {
          ...existingTask,
          ...updates
        }
      }
    })
  }, [])
  
  const resetQueue = useCallback((tasks: TodoistTask[], preserveProcessedTasks = false) => {
    // 1. Track original project IDs for all tasks in this queue
    const newOriginalProjectIds: Record<string, string> = {}
    tasks.forEach(task => {
      newOriginalProjectIds[task.id] = task.projectId
    })
    setOriginalProjectIds(newOriginalProjectIds)
    
    // 2. Build new master task map, preserving existing task data
    setMasterTasks(prev => {
      const newMasterTasks = { ...prev }
      
      // Update or add tasks, BUT preserve any local modifications
      tasks.forEach(task => {
        if (newMasterTasks[task.id]) {
          // Task exists - merge server data with local changes
          // Keep local changes for fields that might have been modified
          const existingTask = newMasterTasks[task.id]
          
          // Create merged task - prefer local changes for key fields
          newMasterTasks[task.id] = {
            ...task, // Start with server data
            // Preserve local changes that might not be synced yet
            projectId: existingTask.projectId,
            priority: existingTask.priority,
            labels: existingTask.labels,
            content: existingTask.content,
            description: existingTask.description,
            due: existingTask.due,
            deadline: existingTask.deadline,
            assigneeId: existingTask.assigneeId,
            // But take server values for system fields
            syncId: task.syncId,
            createdAt: task.createdAt,
            isCompleted: task.isCompleted,
          }
        } else {
          // New task, add it as-is
          newMasterTasks[task.id] = task
        }
      })
      
      return newMasterTasks
    })
    
    // 3. Reset queue to new task IDs (but exclude already processed tasks)
    const taskIds = tasks.map(task => task.id)
    setTaskQueue(taskIds)
    
    // 4. Reset position tracking only if needed
    setQueuePosition(0)
    // Don't reset active position if we're preserving processed tasks
    if (!preserveProcessedTasks) {
      setActiveQueuePosition(0)
    }
    
    // 5. Optionally preserve processed tasks (useful for reloads)
    if (!preserveProcessedTasks) {
      setProcessedTaskIds([])
      setSkippedTaskIds([])
    } else {
      // Filter out any processed task IDs that are no longer in the new queue
      setProcessedTaskIds(prev => prev.filter(id => taskIds.includes(id)))
      setSkippedTaskIds(prev => prev.filter(id => taskIds.includes(id)))
    }
  }, [])
  
  const clearQueue = useCallback(() => {
    setTaskQueue([])
    setQueuePosition(0)
    setActiveQueuePosition(0)
    setProcessedTaskIds([])
    setSkippedTaskIds([])
    setOriginalProjectIds({})
  }, [])
  
  const navigateToNextTask = useCallback(() => {
    if (activeQueue.length === 0) return
    if (activeQueuePosition >= activeQueue.length - 1) return // Already at the end
    
    setActiveQueuePosition(prev => prev + 1)
  }, [activeQueue.length, activeQueuePosition])
  
  const navigateToPrevTask = useCallback(() => {
    if (activeQueue.length === 0) return
    if (activeQueuePosition <= 0) return // Already at the beginning
    
    setActiveQueuePosition(prev => prev - 1)
  }, [activeQueue.length, activeQueuePosition])
  
  const markTaskAsProcessed = useCallback((taskId: string) => {
    // First, check the current position in the active queue
    const currentTaskIndex = activeQueue.findIndex(id => id === taskId)
    const isProcessingCurrentTask = currentTaskIndex === activeQueuePosition
    const tasksAfterCurrent = activeQueue.length - activeQueuePosition - 1
    
    setProcessedTaskIds(prev => {
      if (prev.includes(taskId)) return prev
      return [...prev, taskId]
    })
    
    // Only adjust position if we're processing the current task and at the end
    if (isProcessingCurrentTask && tasksAfterCurrent === 0 && activeQueue.length > 1) {
      // We're at the last task, so move back one position
      setActiveQueuePosition(prev => Math.max(0, prev - 1))
    }
    // Otherwise, keep the same position (next task will slide into current position)
  }, [activeQueuePosition, activeQueue])
  
  const markTaskAsSkipped = useCallback((taskId: string) => {
    setSkippedTaskIds(prev => {
      if (prev.includes(taskId)) return prev
      return [...prev, taskId]
    })
  }, [])
  
  const addSlidingOutTask = useCallback((taskId: string) => {
    setSlidingOutTaskIds(prev => {
      if (prev.includes(taskId)) return prev
      return [...prev, taskId]
    })
  }, [])
  
  const removeSlidingOutTask = useCallback((taskId: string) => {
    setSlidingOutTaskIds(prev => prev.filter(id => id !== taskId))
  }, [])
  
  return {
    // State
    masterTasks,
    taskQueue,
    queuePosition,
    activeQueuePosition,
    processedTaskIds,
    skippedTaskIds,
    slidingOutTaskIds,
    originalProjectIds,
    activeQueue,
    currentTask,
    queuedTasks,
    totalTasks,
    completedTasks,
    
    // Actions
    setMasterTasks,
    updateMasterTask,
    setTaskQueue,
    resetQueue,
    clearQueue,
    setQueuePosition,
    setActiveQueuePosition,
    navigateToNextTask,
    navigateToPrevTask,
    markTaskAsProcessed,
    markTaskAsSkipped,
    setProcessedTaskIds,
    setSkippedTaskIds,
    setSlidingOutTaskIds,
    addSlidingOutTask,
    removeSlidingOutTask
  }
}