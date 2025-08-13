# Focused Task Migration Guide

## Overview
This guide helps migrate TaskProcessor.tsx to use the new focused task architecture.

## Step 1: Remove Old State Variables

Remove these from TaskProcessor:
```typescript
// DELETE THESE:
const [showPriorityOverlay, setShowPriorityOverlay] = useState(false)
const [showProjectOverlay, setShowProjectOverlay] = useState(false)
const [showLabelOverlay, setShowLabelOverlay] = useState(false)
const [showScheduledOverlay, setShowScheduledOverlay] = useState(false)
const [showDeadlineOverlay, setShowDeadlineOverlay] = useState(false)
const [showAssigneeOverlay, setShowAssigneeOverlay] = useState(false)
const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
const [overlayTaskId, setOverlayTaskId] = useState<string | null>(null)
```

## Step 2: Add New Hooks

Add at the top of TaskProcessor:
```typescript
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useOverlayManager } from '@/hooks/useOverlayManager'
import { useTaskKeyboardShortcuts } from '@/hooks/useTaskKeyboardShortcuts'
import OverlayManager from './OverlayManager'

// In the component:
const { setFocusedTask } = useFocusedTask()
const { openOverlay } = useOverlayManager()
```

## Step 3: Update Processing Mode Logic

Replace overlayTask logic:
```typescript
// OLD:
const overlayTask = overlayTaskId ? masterTasks[overlayTaskId] : currentTask

// NEW: Just use focused task in overlays
```

Update current task effect:
```typescript
useEffect(() => {
  if (viewMode === 'processing' && currentTask) {
    setFocusedTask(currentTask.id, currentTask, {
      processingMode,
      queuePosition: activeQueuePosition
    })
  }
}, [currentTask, viewMode, processingMode, activeQueuePosition])
```

## Step 4: Replace Overlay Handlers

Replace all the individual handlers:
```typescript
// DELETE: handleOpenProjectOverlay, handleOpenPriorityOverlay, etc.

// REPLACE WITH:
const handleOpenOverlay = useCallback((type: OverlayType, taskId?: string) => {
  if (taskId) {
    const task = masterTasks[taskId]
    if (task) {
      setFocusedTask(taskId, task)
    }
  }
  openOverlay(type)
}, [masterTasks, setFocusedTask, openOverlay])
```

## Step 5: Update Keyboard Shortcuts

Remove the big keyboard event handler and replace with:
```typescript
useTaskKeyboardShortcuts({
  enabled: !loading,
  hasCollaborators: hasCollaboratorsForCurrentProject(),
  onProcessTask: handleProcessTask,
  onCompleteTask: () => openOverlay('complete')
})
```

## Step 6: Update ListView Props

Update ListView to use the new handlers:
```typescript
<UnifiedListView
  // ... other props
  onOpenProjectOverlay={(taskId) => handleOpenOverlay('project', taskId)}
  onOpenPriorityOverlay={(taskId) => handleOpenOverlay('priority', taskId)}
  onOpenLabelOverlay={(taskId) => handleOpenOverlay('label', taskId)}
  onOpenScheduledOverlay={(taskId) => handleOpenOverlay('scheduled', taskId)}
  onOpenDeadlineOverlay={(taskId) => handleOpenOverlay('deadline', taskId)}
  onOpenAssigneeOverlay={(taskId) => handleOpenOverlay('assignee', taskId)}
/>
```

## Step 7: Replace Overlay Components

Replace all individual overlay components with:
```typescript
<OverlayManager
  projects={projects}
  labels={labels}
  projectCollaborators={projectCollaborators}
  masterTasks={masterTasks}
  onTaskUpdate={autoSaveTask}
  suggestions={currentTaskSuggestions}
  onCompleteTask={handleCompleteTask}
/>
```

## Step 8: Update ListView Component

In UnifiedListView or ListView components:
```typescript
import { useFocusedTask } from '@/contexts/FocusedTaskContext'
import { useListViewIntegration } from '@/hooks/useListViewIntegration'

// Use the integration hook
const { focusedTaskId } = useListViewIntegration({
  highlightedTaskId: listViewState.highlightedTaskId,
  tasks: masterTasks,
  processingMode,
  viewMode: 'list'
})
```

## Benefits After Migration

1. **~200 lines removed** from TaskProcessor
2. **Unified focus management** - no more lost focus
3. **Consistent keyboard shortcuts** across views
4. **Easier to maintain** - overlay logic in one place
5. **Better view switching** - maintains context

## Testing Checklist

- [ ] Keyboard shortcuts work in both views
- [ ] Focus returns after closing overlays
- [ ] Switching views maintains focused task
- [ ] Overlays open for correct task
- [ ] Complete confirmation works
- [ ] No regression in functionality