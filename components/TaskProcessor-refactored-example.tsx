'use client'

// This is an example showing how TaskProcessor would look after refactoring
// DO NOT USE THIS FILE - It's for demonstration purposes only

import { useEffect } from 'react'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useTaskKeyboardShortcuts } from '@/hooks/useTaskKeyboardShortcuts'
import OverlayManager from './OverlayManager'

export default function TaskProcessorRefactoredExample() {
  // ✅ SIMPLIFIED: Use focused task context instead of overlayTask + currentTask
  const { focusedTask, setFocusedTask } = useFocusedTask()
  
  // ✅ SIMPLIFIED: All overlay state is managed by the hook
  // No more showPriorityOverlay, showProjectOverlay, etc.
  
  // ✅ SIMPLIFIED: Keyboard shortcuts are centralized
  useTaskKeyboardShortcuts({
    enabled: !loading && viewMode === 'processing',
    hasCollaborators: hasCollaboratorsForCurrentProject(),
    onProcessTask: handleProcessTask,
    onCompleteTask: handleCompleteTask
  })
  
  // ✅ SIMPLIFIED: Update focused task when current task changes
  useEffect(() => {
    if (viewMode === 'processing' && currentTask) {
      setFocusedTask(currentTask.id, currentTask, {
        processingMode,
        queuePosition: activeQueuePosition
      })
    }
  }, [currentTask, viewMode, processingMode, activeQueuePosition])
  
  // ✅ SIMPLIFIED: Single task update handler
  const handleTaskUpdate = async (taskId: string, updates: TaskUpdate) => {
    // Optimistic update
    setMasterTasks(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...updates }
    }))
    
    // API call
    await autoSaveTask(taskId, updates)
  }
  
  return (
    <div>
      {/* Main content */}
      
      {/* ✅ SIMPLIFIED: All overlays in one component */}
      <OverlayManager
        projects={projects}
        labels={labels}
        projectCollaborators={projectCollaborators}
        masterTasks={masterTasks}
        onTaskUpdate={handleTaskUpdate}
        suggestions={currentTaskSuggestions}
      />
    </div>
  )
}

// What we removed:
// ❌ 7 overlay state variables (showPriorityOverlay, showProjectOverlay, etc.)
// ❌ 7 overlay open/close handlers
// ❌ overlayTaskId state
// ❌ Duplicate keyboard shortcut handling
// ❌ Complex overlay task vs current task logic
// ❌ 7 separate overlay components in the render
// ❌ Focus restoration logic scattered throughout

// What we gained:
// ✅ Single source of truth for focused task
// ✅ Centralized overlay management
// ✅ Unified keyboard shortcuts
// ✅ Automatic focus restoration
// ✅ Easier to maintain and extend