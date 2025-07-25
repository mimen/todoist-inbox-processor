# Workflow Modes - Implementation Plan

## Overview
This document outlines the technical implementation of workflow modes, building on the existing queue standardization infrastructure.

## Phase 1: Core Infrastructure (Week 1)

### 1.1 Type Definitions
```typescript
// types/workflow-mode.ts
export interface WorkflowMode {
  id: string
  name: string
  icon: string
  description: string
  queues: WorkflowQueue[]
  settings: WorkflowSettings
  shortcuts?: KeyboardShortcut[]
  analytics?: boolean
}

export interface WorkflowQueue {
  id: string
  name: string
  type: ProcessingModeType | 'custom'
  filter?: string // Todoist filter syntax for custom
  value?: string | string[] // For standard types
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  limit?: number
  skipIfEmpty?: boolean
}

export interface WorkflowSettings {
  bulkOperations?: boolean
  showEmptyQueues?: boolean
  autoAdvance?: boolean
  multiSelect?: boolean
  uiTheme?: 'default' | 'minimal' | 'focus' | 'crisis'
  quickActions?: string[]
}
```

### 1.2 Default Workflow Modes
```typescript
// constants/workflow-modes.ts
export const DEFAULT_WORKFLOW_MODES: WorkflowMode[] = [
  {
    id: 'morning-review',
    name: 'Morning Review',
    icon: '🌅',
    description: 'Start your day with clarity',
    queues: [
      { id: 'inbox', name: 'Inbox', type: 'project', value: 'inbox' },
      { id: 'overdue', name: 'Overdue', type: 'date', value: 'overdue' },
      { id: 'today', name: 'Today', type: 'date', value: 'today' },
      { id: 'p1', name: 'Urgent', type: 'priority', value: '4' },
      { id: 'waiting', name: 'Waiting', type: 'label', value: '@waiting' }
    ],
    settings: {
      bulkOperations: true,
      showEmptyQueues: true,
      multiSelect: true
    }
  },
  // ... other modes
]
```

### 1.3 Workflow Mode Hook
```typescript
// hooks/useWorkflowMode.ts
export function useWorkflowMode() {
  const [activeMode, setActiveMode] = useState<WorkflowMode | null>(null)
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0)
  const [completedQueues, setCompletedQueues] = useState<string[]>([])
  const { config } = useQueueConfig()

  const startWorkflow = (modeId: string) => {
    const mode = getWorkflowMode(modeId)
    setActiveMode(mode)
    setCurrentQueueIndex(0)
    setCompletedQueues([])
    trackWorkflowStart(modeId)
  }

  const nextQueue = () => {
    if (!activeMode) return
    
    const nextIndex = currentQueueIndex + 1
    if (nextIndex < activeMode.queues.length) {
      setCompletedQueues([...completedQueues, activeMode.queues[currentQueueIndex].id])
      setCurrentQueueIndex(nextIndex)
    } else {
      completeWorkflow()
    }
  }

  const skipQueue = () => {
    // Skip empty or manually skipped queues
    nextQueue()
  }

  const exitWorkflow = () => {
    if (activeMode) {
      trackWorkflowExit(activeMode.id, currentQueueIndex)
    }
    setActiveMode(null)
    setCurrentQueueIndex(0)
  }

  return {
    activeMode,
    currentQueue: activeMode?.queues[currentQueueIndex],
    currentQueueIndex,
    totalQueues: activeMode?.queues.length || 0,
    completedQueues,
    startWorkflow,
    nextQueue,
    skipQueue,
    exitWorkflow,
    isLastQueue: currentQueueIndex === (activeMode?.queues.length || 0) - 1
  }
}
```

## Phase 2: UI Components (Week 1-2)

### 2.1 Workflow Mode Selector
```typescript
// components/WorkflowModeSelector.tsx
export function WorkflowModeSelector() {
  const { activeMode, exitWorkflow } = useWorkflowMode()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="workflow-mode-selector">
      {activeMode ? (
        <div className="active-mode">
          <span>{activeMode.icon} {activeMode.name}</span>
          <button onClick={exitWorkflow}>Exit</button>
        </div>
      ) : (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger>
            <Button variant="outline">
              <Zap className="w-4 h-4 mr-2" />
              Workflow Mode
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {DEFAULT_WORKFLOW_MODES.map(mode => (
              <WorkflowModeOption key={mode.id} mode={mode} />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
```

### 2.2 Workflow Progress Bar
```typescript
// components/WorkflowProgressBar.tsx
export function WorkflowProgressBar() {
  const { activeMode, currentQueueIndex, totalQueues, completedQueues } = useWorkflowMode()
  
  if (!activeMode) return null
  
  return (
    <div className="workflow-progress">
      <div className="progress-header">
        <h3>{activeMode.name}</h3>
        <span>{currentQueueIndex + 1} of {totalQueues}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${(completedQueues.length / totalQueues) * 100}%` }}
        />
      </div>
      <div className="queue-dots">
        {activeMode.queues.map((queue, index) => (
          <div
            key={queue.id}
            className={cn(
              "queue-dot",
              index < currentQueueIndex && "completed",
              index === currentQueueIndex && "active"
            )}
            title={queue.name}
          />
        ))}
      </div>
    </div>
  )
}
```

### 2.3 Workflow-Aware ProcessingModeSelector
```typescript
// Enhance existing ProcessingModeSelector
export function ProcessingModeSelector({ mode, onModeChange, tasks }: Props) {
  const { activeMode, currentQueue } = useWorkflowMode()
  
  // If in workflow mode, override with current queue
  useEffect(() => {
    if (activeMode && currentQueue) {
      const newMode: ProcessingMode = {
        type: currentQueue.type,
        value: currentQueue.value || '',
        filter: currentQueue.filter,
        displayName: currentQueue.name
      }
      onModeChange(newMode)
    }
  }, [activeMode, currentQueue])
  
  // Disable manual mode changes during workflow
  const isDisabled = !!activeMode
  
  return (
    <div className="processing-mode-selector">
      {activeMode && <WorkflowProgressBar />}
      <div className={cn("dropdowns", isDisabled && "opacity-50 pointer-events-none")}>
        {/* Existing dropdown components */}
      </div>
    </div>
  )
}
```

## Phase 3: Integration with Task Processor (Week 2)

### 3.1 Workflow-Aware Task Processing
```typescript
// Enhance TaskProcessor component
export default function TaskProcessor() {
  const { activeMode, currentQueue, nextQueue, isLastQueue } = useWorkflowMode()
  const [tasks, setTasks] = useState<ExtendedTask[]>([])
  
  // Auto-advance when queue is empty
  useEffect(() => {
    if (activeMode && tasks.length === 0 && !isLastQueue) {
      const timer = setTimeout(() => {
        if (activeMode.settings.autoAdvance) {
          nextQueue()
        } else {
          // Show next queue prompt
          setShowNextQueuePrompt(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [tasks.length, activeMode, isLastQueue])
  
  // Apply workflow-specific settings
  const getUITheme = () => {
    if (!activeMode) return 'default'
    return activeMode.settings.uiTheme || 'default'
  }
  
  return (
    <div className={cn("task-processor", `theme-${getUITheme()}`)}>
      {/* Existing task processor UI */}
      {activeMode && (
        <WorkflowQuickActions 
          actions={activeMode.settings.quickActions}
          onAction={handleQuickAction}
        />
      )}
    </div>
  )
}
```

### 3.2 Workflow Quick Actions
```typescript
// components/WorkflowQuickActions.tsx
export function WorkflowQuickActions({ actions, onAction }: Props) {
  const quickActionButtons = {
    'reschedule-tomorrow': { icon: Calendar, label: 'Tomorrow' },
    'add-label': { icon: Tag, label: 'Add Label' },
    'change-priority': { icon: Flag, label: 'Priority' },
    'move-project': { icon: Folder, label: 'Move' },
    'complete-all': { icon: CheckSquare, label: 'Complete All' }
  }
  
  return (
    <div className="workflow-quick-actions">
      {actions?.map(action => {
        const config = quickActionButtons[action]
        if (!config) return null
        
        return (
          <Button
            key={action}
            variant="outline"
            size="sm"
            onClick={() => onAction(action)}
          >
            <config.icon className="w-4 h-4 mr-1" />
            {config.label}
          </Button>
        )
      })}
    </div>
  )
}
```

## Phase 4: Persistence & Analytics (Week 2-3)

### 4.1 Workflow State Persistence
```typescript
// utils/workflow-persistence.ts
const WORKFLOW_STATE_KEY = 'todoist-workflow-state'

export function saveWorkflowState(state: WorkflowState) {
  const data = {
    modeId: state.activeMode?.id,
    currentQueueIndex: state.currentQueueIndex,
    completedQueues: state.completedQueues,
    startedAt: state.startedAt,
    lastUpdated: new Date().toISOString()
  }
  localStorage.setItem(WORKFLOW_STATE_KEY, JSON.stringify(data))
}

export function loadWorkflowState(): WorkflowState | null {
  const stored = localStorage.getItem(WORKFLOW_STATE_KEY)
  if (!stored) return null
  
  const data = JSON.parse(stored)
  // Check if state is stale (> 4 hours old)
  const lastUpdated = new Date(data.lastUpdated)
  const hoursAgo = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)
  
  if (hoursAgo > 4) {
    clearWorkflowState()
    return null
  }
  
  return data
}
```

### 4.2 Workflow Analytics
```typescript
// utils/workflow-analytics.ts
export function trackWorkflowStart(modeId: string) {
  analytics.track('workflow_started', {
    mode_id: modeId,
    time_of_day: getTimeOfDay(),
    day_of_week: getDayOfWeek()
  })
}

export function trackQueueCompletion(modeId: string, queueId: string, stats: QueueStats) {
  analytics.track('queue_completed', {
    mode_id: modeId,
    queue_id: queueId,
    tasks_completed: stats.completed,
    tasks_skipped: stats.skipped,
    duration_seconds: stats.duration
  })
}

export function trackWorkflowCompletion(modeId: string, stats: WorkflowStats) {
  analytics.track('workflow_completed', {
    mode_id: modeId,
    total_tasks: stats.totalTasks,
    completion_rate: stats.completionRate,
    duration_minutes: stats.duration / 60,
    queues_completed: stats.queuesCompleted,
    queues_skipped: stats.queuesSkipped
  })
}
```

## Phase 5: Configuration & Customization (Week 3)

### 5.1 Custom Workflow Builder
```typescript
// components/WorkflowBuilder.tsx
export function WorkflowBuilder() {
  const [customMode, setCustomMode] = useState<WorkflowMode>({
    id: generateId(),
    name: '',
    icon: '⚡',
    description: '',
    queues: [],
    settings: {}
  })
  
  return (
    <div className="workflow-builder">
      <div className="mode-basics">
        <Input
          placeholder="Workflow name"
          value={customMode.name}
          onChange={(e) => setCustomMode({...customMode, name: e.target.value})}
        />
        <EmojiPicker
          value={customMode.icon}
          onChange={(icon) => setCustomMode({...customMode, icon})}
        />
      </div>
      
      <div className="queue-builder">
        <h3>Queue Sequence</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="queues">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {customMode.queues.map((queue, index) => (
                  <Draggable key={queue.id} draggableId={queue.id} index={index}>
                    {(provided) => (
                      <QueueItem
                        queue={queue}
                        provided={provided}
                        onUpdate={(updated) => updateQueue(index, updated)}
                        onRemove={() => removeQueue(index)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <Button onClick={addQueue}>Add Queue</Button>
      </div>
      
      <div className="workflow-settings">
        <h3>Settings</h3>
        <WorkflowSettingsForm
          settings={customMode.settings}
          onChange={(settings) => setCustomMode({...customMode, settings})}
        />
      </div>
      
      <div className="actions">
        <Button onClick={saveCustomWorkflow}>Save Workflow</Button>
        <Button variant="outline" onClick={testWorkflow}>Test</Button>
      </div>
    </div>
  )
}
```

### 5.2 Time-Based Recommendations
```typescript
// hooks/useWorkflowRecommendations.ts
export function useWorkflowRecommendations() {
  const [recommendations, setRecommendations] = useState<WorkflowMode[]>([])
  const { user } = useUser()
  
  useEffect(() => {
    const hour = new Date().getHours()
    const dayOfWeek = new Date().getDay()
    
    const recommended = []
    
    // Morning (6am - 10am)
    if (hour >= 6 && hour < 10) {
      recommended.push(getWorkflowMode('morning-review'))
    }
    
    // Focus time (10am - 12pm, 2pm - 4pm)
    if ((hour >= 10 && hour < 12) || (hour >= 14 && hour < 16)) {
      recommended.push(getWorkflowMode('focus-execution'))
    }
    
    // End of day (5pm - 7pm)
    if (hour >= 17 && hour < 19) {
      recommended.push(getWorkflowMode('end-of-day'))
    }
    
    // Weekly planning (Sunday evening or Monday morning)
    if ((dayOfWeek === 0 && hour >= 18) || (dayOfWeek === 1 && hour < 10)) {
      recommended.push(getWorkflowMode('weekly-planning'))
    }
    
    // Check for crisis indicators
    const overdueCount = useOverdueTaskCount()
    if (overdueCount > 10) {
      recommended.unshift(getWorkflowMode('crisis-management'))
    }
    
    setRecommendations(recommended.slice(0, 3))
  }, [])
  
  return recommendations
}
```

## Implementation Timeline

### Week 1: Core Infrastructure
- Days 1-2: Type definitions and constants
- Days 3-4: Workflow mode hook and state management
- Day 5: Basic UI components (selector, progress bar)

### Week 2: Integration
- Days 1-2: Task processor integration
- Days 3-4: Quick actions and UI themes
- Day 5: Testing and bug fixes

### Week 3: Advanced Features
- Days 1-2: Persistence and analytics
- Days 3-4: Custom workflow builder
- Day 5: Time-based recommendations

## Testing Strategy

### Unit Tests
```typescript
// __tests__/workflow-mode.test.ts
describe('WorkflowMode', () => {
  it('should progress through queues correctly', () => {
    const { result } = renderHook(() => useWorkflowMode())
    
    act(() => {
      result.current.startWorkflow('morning-review')
    })
    
    expect(result.current.currentQueueIndex).toBe(0)
    expect(result.current.currentQueue?.name).toBe('Inbox')
    
    act(() => {
      result.current.nextQueue()
    })
    
    expect(result.current.currentQueueIndex).toBe(1)
    expect(result.current.currentQueue?.name).toBe('Overdue')
  })
})
```

### Integration Tests
- Test workflow mode with real task data
- Verify queue filtering works correctly
- Test persistence across page reloads
- Verify analytics tracking

## Migration Path

1. **Phase 1**: Deploy workflow infrastructure without UI
2. **Phase 2**: Add workflow selector for beta users
3. **Phase 3**: Enable for all users with default modes
4. **Phase 4**: Add custom workflow builder
5. **Phase 5**: Full analytics and recommendations