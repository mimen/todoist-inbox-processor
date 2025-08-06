import { useMemo, useCallback } from 'react'
import { QueueProgressionState, UseQueueProgressionProps } from '@/types/queue'
import { DropdownOption } from '@/types/dropdown'

export function useQueueProgression({
  currentValue,
  dropdownOptions = [],
  config
}: UseQueueProgressionProps): QueueProgressionState {
  
  // Filter out empty queues if configured
  const activeQueues = useMemo(() => {
    const options = dropdownOptions || []
    if (config?.behavior?.showEmptyQueues) {
      return options
    }
    return options.filter(option => (option.count || 0) > 0)
  }, [dropdownOptions, config])

  // Find current queue index by comparing values
  const currentQueueIndex = useMemo(() => {
    if (!currentValue || activeQueues.length === 0) return 0
    
    // Special handling for prioritized mode (JSON string values)
    let compareValue = currentValue
    if (typeof currentValue === 'string' && currentValue.startsWith('{')) {
      try {
        const parsed = JSON.parse(currentValue)
        // For prioritized mode, we need to find by the filterValue
        compareValue = parsed.filterValue
        
        // Special case for inbox
        if (parsed.filterType === 'project' && parsed.filterValue) {
          // Check if any queue has id 'inbox' and this filterValue matches an inbox project
          const inboxQueue = activeQueues.find(q => q.id === 'inbox')
          if (inboxQueue) {
            // We might be looking for the inbox
            compareValue = 'inbox'
          }
        }
      } catch (e) {
        // Not JSON, use as-is
      }
    }
    
    const index = activeQueues.findIndex(queue => {
      const queueId = queue.id
      const currentVal = compareValue
      
      // Handle string comparison
      if (typeof queueId === 'string' && typeof currentVal === 'string') {
        return queueId === currentVal
      }
      
      // Convert both to strings as fallback
      return String(queueId) === String(currentVal)
    })
    
    console.log('[useQueueProgression] Finding queue index:', {
      originalValue: currentValue,
      compareValue,
      activeQueuesLength: activeQueues.length,
      foundIndex: index,
      returnedIndex: index === -1 ? 0 : index,
      queueIds: activeQueues.map(q => ({ id: q.id, label: q.label }))
    })
    
    return index === -1 ? 0 : index
  }, [currentValue, activeQueues])

  // Get current queue
  const currentQueue = useMemo(() => {
    if (activeQueues.length === 0) return null
    return activeQueues[currentQueueIndex] || null
  }, [activeQueues, currentQueueIndex])

  // Get next queue
  const nextQueue = useMemo(() => {
    if (activeQueues.length === 0) return null
    const nextIndex = currentQueueIndex + 1
    if (nextIndex >= activeQueues.length) return null
    
    console.log('[useQueueProgression] Calculating next queue:', {
      currentQueueIndex,
      nextIndex,
      totalQueues: activeQueues.length,
      hasNext: nextIndex < activeQueues.length,
      nextQueue: activeQueues[nextIndex]?.label
    })
    
    return activeQueues[nextIndex]
  }, [activeQueues, currentQueueIndex])

  // Check if there's a next queue
  const hasNextQueue = useMemo(() => {
    return nextQueue !== null
  }, [nextQueue])

  // Move to next queue - returns the next queue for the parent to handle
  const moveToNextQueue = useCallback(() => {
    if (!nextQueue) {
      console.log('Already at last queue')
      return null
    }
    
    // Return the next queue so parent can update the mode
    return nextQueue
  }, [nextQueue])

  // Calculate progress
  const queueProgress = useMemo(() => ({
    current: currentQueueIndex + 1,
    total: activeQueues.length
  }), [currentQueueIndex, activeQueues])

  // Simplified state object
  const state: QueueProgressionState = {
    currentQueue,
    nextQueue,
    hasNextQueue,
    moveToNextQueue,
    queueProgress
  }

  return state
}