import { useCallback } from 'react'
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useOverlayContext, OverlayType } from '@/contexts/OverlayContext'

export type { OverlayType }

export function useOverlayManager() {
  const { focusedTask, setLastFocusedElement, restoreFocus } = useFocusedTask()
  const { overlays, isAnyOverlayOpen, openOverlay: contextOpenOverlay, closeOverlay: contextCloseOverlay, closeAllOverlays: contextCloseAllOverlays, isOverlayOpen } = useOverlayContext()

  const openOverlay = useCallback((type: OverlayType) => {
    // Store current focus before opening overlay
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
      setLastFocusedElement(activeElement)
    }
    
    contextOpenOverlay(type)
  }, [focusedTask, setLastFocusedElement, contextOpenOverlay])

  const closeOverlay = useCallback((type: OverlayType) => {
    contextCloseOverlay(type)
    
    // Restore focus after a brief delay to ensure overlay is fully closed
    setTimeout(() => {
      restoreFocus()
    }, 100)
  }, [restoreFocus, contextCloseOverlay])

  const closeAllOverlays = useCallback(() => {
    contextCloseAllOverlays()
    
    // Restore focus
    setTimeout(() => {
      restoreFocus()
    }, 100)
  }, [restoreFocus, contextCloseAllOverlays])

  return {
    overlays,
    isAnyOverlayOpen,
    openOverlay,
    closeOverlay,
    closeAllOverlays,
    isOverlayOpen,
    focusedTask
  }
}