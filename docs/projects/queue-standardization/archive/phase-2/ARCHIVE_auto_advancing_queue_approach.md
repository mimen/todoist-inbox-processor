# Prioritized Queue Implementation

## Overview
Implement a single prioritized queue sequence that processes tasks in order of importance and urgency. This will serve as the foundation for future workflow modes.

## Queue Sequence

The prioritized queue will process tasks in this exact order:

1. **#inbox** - Unprocessed tasks need attention first
2. **Overdue** - Tasks past their schedule OR deadline date
3. **P1 Tasks** - Urgent priority tasks
4. **P1 Projects** - All tasks in projects marked as P1
5. **Today** - Tasks scheduled OR with deadline today
6. **P2 Tasks** - High priority tasks
7. **P2 Projects** - All tasks in projects marked as P2

## JSON Configuration Design

### Queue Configuration Structure
```json
{
  "prioritizedQueue": {
    "enabled": true,
    "sequence": [
      {
        "id": "inbox",
        "name": "Inbox",
        "type": "project",
        "value": "Inbox",
        "icon": "📥",
        "skipIfEmpty": false
      },
      {
        "id": "overdue",
        "name": "Overdue",
        "type": "custom",
        "filter": "(overdue | @deadline < today)",
        "icon": "⏰",
        "skipIfEmpty": false
      },
      {
        "id": "p1-tasks",
        "name": "P1 Tasks",
        "type": "priority",
        "value": "4",
        "icon": "🚨",
        "skipIfEmpty": false
      },
      {
        "id": "p1-projects",
        "name": "P1 Projects",
        "type": "custom",
        "filter": "##P1",
        "icon": "🔥",
        "skipIfEmpty": true
      },
      {
        "id": "today",
        "name": "Today",
        "type": "custom",
        "filter": "(today | @deadline = today)",
        "icon": "📅",
        "skipIfEmpty": false
      },
      {
        "id": "p2-tasks",
        "name": "P2 Tasks",
        "type": "priority",
        "value": "3",
        "icon": "⚡",
        "skipIfEmpty": true
      },
      {
        "id": "p2-projects",
        "name": "P2 Projects",
        "type": "custom",
        "filter": "##P2",
        "icon": "📊",
        "skipIfEmpty": true
      }
    ],
    "settings": {
      "autoAdvance": true,
      "showProgress": true,
      "showEmptyQueues": false,
      "persistProgress": true
    }
  }
}
```

## Implementation Steps

### Step 1: Add Types
```typescript
// types/prioritized-queue.ts
export interface QueueItem {
  id: string
  name: string
  type: 'project' | 'priority' | 'label' | 'date' | 'custom'
  value?: string
  filter?: string // Todoist filter syntax for custom type
  icon?: string
  skipIfEmpty?: boolean
}

export interface PrioritizedQueueConfig {
  enabled: boolean
  sequence: QueueItem[]
  settings: {
    autoAdvance: boolean
    showProgress: boolean
    showEmptyQueues: boolean
    persistProgress: boolean
  }
}
```

### Step 2: Create Queue Hook
```typescript
// hooks/usePrioritizedQueue.ts
export function usePrioritizedQueue() {
  const { config } = useQueueConfig()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedQueues, setCompletedQueues] = useState<string[]>([])
  
  const queueConfig = config.prioritizedQueue
  const currentQueue = queueConfig?.sequence[currentIndex]
  
  // Convert queue item to ProcessingMode
  const getCurrentMode = (): ProcessingMode | null => {
    if (!currentQueue || !queueConfig?.enabled) return null
    
    if (currentQueue.type === 'custom' && currentQueue.filter) {
      return {
        type: 'filter',
        value: currentQueue.filter,
        displayName: currentQueue.name
      }
    }
    
    return {
      type: currentQueue.type as ProcessingModeType,
      value: currentQueue.value || '',
      displayName: currentQueue.name
    }
  }
  
  const nextQueue = () => {
    if (currentIndex < queueConfig.sequence.length - 1) {
      setCompletedQueues([...completedQueues, currentQueue.id])
      setCurrentIndex(currentIndex + 1)
    }
  }
  
  const previousQueue = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setCompletedQueues(completedQueues.slice(0, -1))
    }
  }
  
  const reset = () => {
    setCurrentIndex(0)
    setCompletedQueues([])
  }
  
  return {
    enabled: queueConfig?.enabled || false,
    currentQueue,
    currentMode: getCurrentMode(),
    currentIndex,
    totalQueues: queueConfig?.sequence.length || 0,
    completedQueues,
    progress: (completedQueues.length / (queueConfig?.sequence.length || 1)) * 100,
    isLastQueue: currentIndex === (queueConfig?.sequence.length || 0) - 1,
    nextQueue,
    previousQueue,
    reset
  }
}
```

### Step 3: Queue Progress Component
```typescript
// components/QueueProgress.tsx
export function QueueProgress() {
  const { 
    enabled, 
    currentQueue, 
    currentIndex, 
    totalQueues, 
    progress,
    completedQueues 
  } = usePrioritizedQueue()
  
  if (!enabled) return null
  
  return (
    <div className="queue-progress bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentQueue?.icon}</span>
            <div>
              <h3 className="font-medium">{currentQueue?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Queue {currentIndex + 1} of {totalQueues}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-48">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex gap-1">
              {Array.from({ length: totalQueues }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i < completedQueues.length && "bg-primary",
                    i === currentIndex && "bg-primary ring-2 ring-primary/20",
                    i > currentIndex && "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 4: Integrate with ProcessingModeSelector
```typescript
// Update ProcessingModeSelector
export function ProcessingModeSelector({ mode, onModeChange, tasks }: Props) {
  const { enabled, currentMode, currentQueue } = usePrioritizedQueue()
  
  // Use prioritized queue mode if enabled
  useEffect(() => {
    if (enabled && currentMode) {
      onModeChange(currentMode)
    }
  }, [enabled, currentMode])
  
  // Disable manual mode changes when prioritized queue is active
  const isDisabled = enabled
  
  return (
    <>
      <QueueProgress />
      <div className={cn(
        "processing-mode-selector", 
        isDisabled && "opacity-50 pointer-events-none"
      )}>
        {/* Existing dropdowns */}
      </div>
    </>
  )
}
```

### Step 5: Auto-advance on Empty Queue
```typescript
// In TaskProcessor component
export default function TaskProcessor() {
  const { tasks } = useTasks()
  const { 
    enabled, 
    currentQueue, 
    nextQueue, 
    isLastQueue 
  } = usePrioritizedQueue()
  
  // Auto-advance when queue is empty
  useEffect(() => {
    if (enabled && tasks.length === 0 && !isLastQueue) {
      // Skip if configured to skip empty queues
      if (currentQueue?.skipIfEmpty) {
        nextQueue()
      } else {
        // Show empty queue message with option to continue
        setShowEmptyQueue(true)
      }
    }
  }, [enabled, tasks.length, currentQueue, isLastQueue])
  
  return (
    <div className="task-processor">
      {/* Existing UI */}
      
      {showEmptyQueue && (
        <EmptyQueuePrompt
          queueName={currentQueue?.name}
          onContinue={() => {
            setShowEmptyQueue(false)
            nextQueue()
          }}
          onStay={() => setShowEmptyQueue(false)}
        />
      )}
    </div>
  )
}
```

### Step 6: Keyboard Shortcuts
```typescript
// hooks/useQueueKeyboardShortcuts.ts
export function useQueueKeyboardShortcuts() {
  const { enabled, nextQueue, previousQueue, isLastQueue } = usePrioritizedQueue()
  
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Right arrow or Tab: next queue
      if ((e.key === 'ArrowRight' || e.key === 'Tab') && !e.shiftKey) {
        if (!isLastQueue) {
          e.preventDefault()
          nextQueue()
        }
      }
      
      // Left arrow or Shift+Tab: previous queue
      if ((e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey))) {
        e.preventDefault()
        previousQueue()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [enabled, nextQueue, previousQueue, isLastQueue])
}
```

## Testing Plan

### 1. Unit Tests
- Test queue sequence progression
- Test mode conversion for different queue types
- Test skip empty queue logic
- Test persistence and recovery

### 2. Integration Tests
- Test with real task data
- Verify filters work correctly (especially custom filters)
- Test auto-advance behavior
- Test keyboard navigation

### 3. User Acceptance Tests
- Process through entire queue sequence
- Test with empty queues
- Test interruption and resume
- Test configuration changes

## Future Enhancements

Once this basic implementation is working:

1. **Multiple Queue Sequences**: Allow defining multiple sequences (morning, evening, etc.)
2. **Dynamic Queues**: Add queues based on current data (e.g., only show P1 projects if they exist)
3. **Queue Analytics**: Track time spent in each queue, completion rates
4. **Custom Filters UI**: Visual builder for custom queue filters
5. **Queue Templates**: Share queue sequences between users

## Implementation Timeline

- **Day 1**: Types and configuration structure
- **Day 2**: Queue hook and progress component
- **Day 3**: Integration with existing components
- **Day 4**: Auto-advance and keyboard shortcuts
- **Day 5**: Testing and refinement