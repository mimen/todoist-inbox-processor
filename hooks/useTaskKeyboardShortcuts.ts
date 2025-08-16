import { useEffect, useCallback } from 'react'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useOverlayManager } from './useOverlayManager'
import { useNewTaskContext } from '@/contexts/NewTaskContext'

interface UseTaskKeyboardShortcutsProps {
  enabled?: boolean
  hasCollaborators?: boolean
  onProcessTask?: () => void
  onCompleteTask?: () => void
}

export function useTaskKeyboardShortcuts({
  enabled = true,
  hasCollaborators = false,
  onProcessTask,
  onCompleteTask
}: UseTaskKeyboardShortcutsProps = {}) {
  const { focusedTask } = useFocusedTask()
  const { openOverlay, closeAllOverlays, isAnyOverlayOpen } = useOverlayManager()
  const { openNewTask } = useNewTaskContext()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if disabled or if typing in an input
    if (!enabled) return
    
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        document.querySelector('[role="listbox"]')) {
      return
    }

    // Escape or backtick closes all overlays
    if (e.key === 'Escape' || e.key === '`') {
      if (isAnyOverlayOpen) {
        e.preventDefault()
        closeAllOverlays()
        return
      }
    }
    
    // 'n' creates a new task (doesn't require focused task)
    if (e.key === 'n' || e.key === 'N') {
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        openNewTask()
        return
      }
    }

    // Task-specific shortcuts require a focused task
    if (!focusedTask) return

    // Don't handle shortcuts when overlays are open (they handle their own keys)
    if (isAnyOverlayOpen) return

    switch (e.key) {
      case 'p':
      case 'P':
        if (!e.shiftKey) {
          e.preventDefault()
          openOverlay('priority')
        }
        break
        
      case '#':
        e.preventDefault()
        openOverlay('project')
        break
        
      case '@':
        e.preventDefault()
        openOverlay('label')
        break
        
      case 's':
      case 'S':
        e.preventDefault()
        openOverlay('scheduled')
        break
        
      case 'd':
      case 'D':
        e.preventDefault()
        openOverlay('deadline')
        break
        
      case '+':
      case '=':  // Handle both + and = keys
        if (e.shiftKey && hasCollaborators) {
          e.preventDefault()
          openOverlay('assignee')
        }
        break
        
      case 'c':
      case 'C':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          if (onCompleteTask) {
            onCompleteTask()
          } else {
            openOverlay('complete')
          }
        }
        break
        
      case 'e':
      case 'E':
        if (onProcessTask) {
          e.preventDefault()
          onProcessTask()
        }
        break
    }
  }, [enabled, focusedTask, isAnyOverlayOpen, openOverlay, closeAllOverlays, openNewTask, hasCollaborators, onProcessTask, onCompleteTask])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}