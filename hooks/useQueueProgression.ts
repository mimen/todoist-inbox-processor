import { useState, useMemo, useCallback, useEffect } from 'react'
import { QueueState, QueueProgressionState, UseQueueProgressionProps } from '@/types/queue'
import { DropdownOption } from '@/types/dropdown'

export function useQueueProgression({
  mode,
  dropdownOptions = [],
  config
}: UseQueueProgressionProps): QueueProgressionState {
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0)
  const [completedQueues, setCompletedQueues] = useState<string[]>([])
  
  // Reset queue position when mode changes
  useEffect(() => {
    setCurrentQueueIndex(0)
    setCompletedQueues([])
  }, [mode])

  // Filter out empty queues if configured
  const activeQueues = useMemo(() => {
    const options = dropdownOptions || []
    if (config?.behavior?.showEmptyQueues) {
      return options
    }
    return options.filter(option => (option.count || 0) > 0)
  }, [dropdownOptions, config])

  // Get current queue
  const currentQueue = useMemo(() => {
    if (activeQueues.length === 0) return null
    if (currentQueueIndex >= activeQueues.length) {
      return activeQueues[0]
    }
    return activeQueues[currentQueueIndex]
  }, [activeQueues, currentQueueIndex])

  // Get next queue
  const nextQueue = useMemo(() => {
    if (activeQueues.length === 0) return null
    const nextIndex = currentQueueIndex + 1
    if (nextIndex >= activeQueues.length) return null
    return activeQueues[nextIndex]
  }, [activeQueues, currentQueueIndex])

  // Check if there's a next queue
  const hasNextQueue = useMemo(() => {
    return nextQueue !== null
  }, [nextQueue])

  // Move to next queue
  const moveToNextQueue = useCallback(() => {
    const newIndex = currentQueueIndex + 1
    if (newIndex >= activeQueues.length) {
      // Stay at current if no next queue (last queue edge case)
      console.log('Already at last queue')
      return
    }

    // Mark current queue as completed
    const currentQueueId = activeQueues[currentQueueIndex]?.id
    if (currentQueueId) {
      setCompletedQueues(prev => [...prev, currentQueueId])
    }
    
    setCurrentQueueIndex(newIndex)
    
    // TODO: Future enhancements:
    // - Emit analytics event for queue completion
    // - Save state to localStorage if persistState is enabled
    // - Check for conditional progression rules
    // - Auto-skip empty queues if configured
    // - Show celebration animation for milestones
  }, [activeQueues, currentQueueIndex])

  // Calculate progress
  const queueProgress = useMemo(() => ({
    current: currentQueueIndex + 1,
    total: activeQueues.length
  }), [currentQueueIndex, activeQueues])

  // Additional methods for future use
  const resetQueueProgress = useCallback(() => {
    setCurrentQueueIndex(0)
    setCompletedQueues([])
  }, [])

  const jumpToQueue = useCallback((index: number) => {
    if (index >= 0 && index < activeQueues.length) {
      setCurrentQueueIndex(index)
    }
  }, [activeQueues])

  const markCurrentAsCompleted = useCallback(() => {
    const currentQueueId = currentQueue?.id
    if (currentQueueId && !completedQueues.includes(currentQueueId)) {
      setCompletedQueues(prev => [...prev, currentQueueId])
    }
  }, [currentQueue, completedQueues])

  // Store additional methods on the state object for future use
  // @ts-ignore - Adding extra properties for internal use
  const state: QueueProgressionState & {
    resetQueueProgress: () => void
    jumpToQueue: (index: number) => void
    markCurrentAsCompleted: () => void
  } = {
    currentQueue,
    nextQueue,
    hasNextQueue,
    moveToNextQueue,
    queueProgress,
    resetQueueProgress,
    jumpToQueue,
    markCurrentAsCompleted
  }

  return state
}