# Extending the Queue System

This guide explains how to add new queue types, customize sorting, and extend the queue progression system.

## Table of Contents
- [Adding New Queue Types](#adding-new-queue-types)
- [Custom Sort Functions](#custom-sort-functions)
- [State Persistence](#state-persistence)
- [Custom Filters](#custom-filters)
- [Multi-Select Support](#multi-select-support)

## Adding New Queue Types

To add a new queue type, follow these steps:

### 1. Update Type Definitions

First, add your new type to the `ProcessingModeType` enum in `types/processing-mode.ts`:

```typescript
export type ProcessingModeType = 
  | 'project' 
  | 'priority' 
  | 'label' 
  | 'date' 
  | 'deadline' 
  | 'preset' 
  | 'all'
  | 'assignee'  // New type
```

### 2. Create Option Provider Hook

Create a new hook in `hooks/useAssigneeOptions.ts`:

```typescript
import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask, TodoistUser } from '@/lib/types'

export function useAssigneeOptions(
  tasks: TodoistTask[],
  users: TodoistUser[],
  config?: {
    sortBy?: 'name' | 'count'
    includeUnassigned?: boolean
  }
): DropdownOption[] {
  return useMemo(() => {
    // Count tasks per assignee
    const assigneeCounts = new Map<string, number>()
    
    tasks.forEach(task => {
      const key = task.assigneeId || 'unassigned'
      assigneeCounts.set(key, (assigneeCounts.get(key) || 0) + 1)
    })
    
    // Build options
    const options: DropdownOption[] = []
    
    // Add unassigned option if needed
    if (config?.includeUnassigned && assigneeCounts.has('unassigned')) {
      options.push({
        value: 'unassigned',
        label: 'Unassigned',
        count: assigneeCounts.get('unassigned') || 0,
        type: 'assignee',
        icon: 'UserX' // Lucide icon name
      })
    }
    
    // Add user options
    users.forEach(user => {
      const count = assigneeCounts.get(user.id.toString()) || 0
      if (count > 0) {
        options.push({
          value: user.id.toString(),
          label: user.fullName,
          count,
          type: 'assignee',
          icon: 'User',
          metadata: {
            email: user.email,
            avatarUrl: user.avatarBig
          }
        })
      }
    })
    
    // Sort based on config
    if (config?.sortBy === 'name') {
      options.sort((a, b) => a.label.localeCompare(b.label))
    } else {
      options.sort((a, b) => b.count - a.count)
    }
    
    return options
  }, [tasks, users, config])
}
```

### 3. Update UnifiedDropdown Component

Add icon support for your new type in `components/OptionIcon.tsx`:

```typescript
case 'assignee':
  return option.value === 'unassigned' 
    ? <UserX className={className} />
    : <User className={className} />
```

### 4. Register in ProcessingModeSelector

Add your new dropdown to the mode selector in `components/ProcessingModeSelector.tsx`:

```typescript
const modeComponents = {
  // ... existing modes
  assignee: (
    <UnifiedDropdown
      options={assigneeOptions}
      value={mode.value as string}
      onChange={(value) => handleModeChange('assignee', value)}
      placeholder="Select assignee..."
      enableSearch={true}
      dropdownKey="assignee"
    />
  )
}
```

### 5. Add Filtering Logic

Update `lib/task-filters.ts` to handle your new mode:

```typescript
case 'assignee':
  if (mode.value === 'unassigned') {
    return tasks.filter(task => !task.assigneeId)
  } else {
    return tasks.filter(task => task.assigneeId === mode.value)
  }
```

## Custom Sort Functions

To add custom sorting logic:

### 1. Define Sort Function

Create a sort function in `utils/sort-functions.ts`:

```typescript
export const sortByDueDate = (a: DropdownOption, b: DropdownOption): number => {
  const dateA = a.metadata?.dueDate ? new Date(a.metadata.dueDate) : null
  const dateB = b.metadata?.dueDate ? new Date(b.metadata.dueDate) : null
  
  if (!dateA && !dateB) return 0
  if (!dateA) return 1
  if (!dateB) return -1
  
  return dateA.getTime() - dateB.getTime()
}
```

### 2. Register Sort Function

Add to the sort registry:

```typescript
const SORT_FUNCTIONS: Record<string, SortFunction> = {
  'default': defaultSort,
  'name': sortByName,
  'count': sortByCount,
  'priority': sortByPriority,
  'dueDate': sortByDueDate  // New sort
}
```

### 3. Use in Option Provider

Apply the sort in your hook:

```typescript
if (config?.sortBy === 'dueDate') {
  options.sort(SORT_FUNCTIONS.dueDate)
}
```

## State Persistence

To enable state persistence (future feature):

### 1. Create Persistence Hook

```typescript
// hooks/useQueueState.ts
export function useQueueState() {
  const [state, setState] = useState<QueueState>(() => {
    // TODO: Load from localStorage
    return getDefaultState()
  })
  
  useEffect(() => {
    // TODO: Save to localStorage
    if (queueConfig.isFeatureEnabled('persistState')) {
      localStorage.setItem('queue-state', JSON.stringify(state))
    }
  }, [state])
  
  return [state, setState] as const
}
```

### 2. Integrate with QueueProgression

Replace the internal state with the persistent version:

```typescript
const [queueState, setQueueState] = useQueueState()
```

## Custom Filters

To add custom filter functions:

### 1. Define Filter Interface

```typescript
interface CustomFilter {
  id: string
  name: string
  description: string
  filter: (task: TodoistTask) => boolean
}
```

### 2. Register Custom Filters

```typescript
const CUSTOM_FILTERS: Record<string, CustomFilter> = {
  'highPriorityOverdue': {
    id: 'highPriorityOverdue',
    name: 'High Priority & Overdue',
    description: 'Tasks that are both high priority and overdue',
    filter: (task) => {
      return task.priority >= 3 && 
             task.due && 
             new Date(task.due.date) < new Date()
    }
  }
}
```

### 3. Use in Preset Options

Add custom filters as preset options:

```typescript
Object.values(CUSTOM_FILTERS).forEach(filter => {
  options.push({
    value: filter.id,
    label: filter.name,
    type: 'preset',
    count: tasks.filter(filter.filter).length,
    metadata: { description: filter.description }
  })
})
```

## Multi-Select Support

Multi-select is partially implemented. To enable for a queue type:

### 1. Update Configuration

```typescript
{ 
  type: 'label', 
  config: { 
    multiSelect: true,
    enableSearch: true 
  } 
}
```

### 2. Handle Array Values

Update filtering to handle arrays:

```typescript
case 'label':
  if (Array.isArray(mode.value)) {
    return tasks.filter(task => 
      mode.value.some(label => task.labels.includes(label))
    )
  }
  // Single value handling...
```

### 3. Update UnifiedDropdown

The component already has placeholder support for multi-select. Full implementation requires:
- Checkbox UI for each option
- Array state management
- Updated onChange handling

## Example: Adding a "Context" Queue Type

Here's a complete example of adding a GTD-style context queue:

```typescript
// 1. Add type
export type ProcessingModeType = ... | 'context'

// 2. Create hook
export function useContextOptions(tasks: TodoistTask[]): DropdownOption[] {
  // Contexts are labels starting with @
  return useMemo(() => {
    const contextCounts = new Map<string, number>()
    
    tasks.forEach(task => {
      task.labels
        .filter(label => label.startsWith('@'))
        .forEach(context => {
          contextCounts.set(context, (contextCounts.get(context) || 0) + 1)
        })
    })
    
    return Array.from(contextCounts.entries())
      .map(([context, count]) => ({
        value: context,
        label: context,
        count,
        type: 'context',
        icon: 'MapPin'
      }))
      .sort((a, b) => b.count - a.count)
  }, [tasks])
}

// 3. Add filtering
case 'context':
  return tasks.filter(task => task.labels.includes(mode.value as string))

// 4. Register in UI
context: (
  <UnifiedDropdown
    options={contextOptions}
    value={mode.value as string}
    onChange={(value) => handleModeChange('context', value)}
    placeholder="Select context..."
    enableSearch={true}
    dropdownKey="context"
  />
)
```

## Future Enhancements

The architecture supports these future features:
- Dynamic queue ordering via drag-and-drop
- Queue templates for different workflows
- Conditional queue progression based on time/completion
- Integration with external configuration systems
- Queue analytics and productivity tracking