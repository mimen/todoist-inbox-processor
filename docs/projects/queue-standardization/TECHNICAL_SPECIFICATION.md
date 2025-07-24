# Queue Standardization Technical Specification

## Overview
This document provides detailed technical specifications for implementing the queue standardization and next-queue feature in the Todoist Inbox Processor.

## Core Interfaces and Types

### 1. DropdownOption Interface
```typescript
// File: types/dropdown.ts
export interface DropdownOption {
  id: string                    // Unique identifier
  label: string                 // Display text
  icon?: React.ReactNode | string  // Icon component or emoji
  iconColor?: string           // Color for icon (hex or Todoist color name)
  count?: number               // Task count for this option
  description?: string         // Optional description text
  metadata?: any              // Additional data (project object, priority value, etc.)
  children?: DropdownOption[] // For hierarchical items (sub-projects)
  type: DropdownOptionType    // Type for icon rendering
}

export type DropdownOptionType = 
  | 'project' 
  | 'priority' 
  | 'label' 
  | 'date' 
  | 'deadline' 
  | 'preset' 
  | 'filter' 
  | 'all'
  | 'custom'
```

### 2. Dropdown Configuration
```typescript
// File: types/dropdown.ts
export interface DropdownConfig {
  selectionMode: 'single' | 'multi'
  showSearch?: boolean
  showCounts?: boolean
  hierarchical?: boolean
  sortOptions?: SortOption[]
  defaultSort?: string
  placeholder?: string
  emptyMessage?: string
}

export interface SortOption {
  key: string
  label: string
  sortFn: (a: DropdownOption, b: DropdownOption) => number
}
```

#### Hierarchical Display and Sorting Behavior
**Important**: Hierarchical display (parent-child relationships) only works with the default sort order.

- **Default sort**: Maintains parent-child hierarchy with indentation
- **Any other sort**: Flattens the hierarchy, showing all items at the same level

```typescript
// Example: Project dropdown behavior
if (config.defaultSort === 'default' && config.hierarchical) {
  // Show projects with parent-child indentation
  // Work
  //   ├─ Work Subproject 1
  //   └─ Work Subproject 2
  // Personal
} else {
  // Flatten all projects when sorting by name, priority, or count
  // Personal
  // Work
  // Work Subproject 1
  // Work Subproject 2
}
```

### 3. Queue State Management
```typescript
// File: types/queue.ts
export interface QueueState {
  availableQueues: DropdownOption[]  // All queues for current mode
  currentQueueIndex: number          // Current position
  completedQueues: string[]          // Completed queue IDs
  queueConfig?: QueueConfiguration   // Optional config
}

export interface QueueConfiguration {
  standardModes: {
    [key in ProcessingModeType]?: ModeConfig
  }
  customQueues?: CustomQueue[]
  behavior?: QueueBehavior
}

export interface ModeConfig {
  sortBy?: string
  multiSelect?: boolean
  hideEmpty?: boolean
  excludeItems?: string[]
  reverseOrder?: boolean
}

export interface CustomQueue {
  id: string
  name: string
  icon?: string
  description?: string
  sequence: QueueItem[]
}

export interface QueueItem {
  type: DropdownOptionType
  id: string
  label?: string  // Optional override label
}

export interface QueueBehavior {
  rememberPosition?: boolean
  autoAdvance?: boolean
  showEmptyQueues?: boolean
  confirmQueueSwitch?: boolean
}
```

### 4. Updated Processing Mode
```typescript
// File: types/processing-mode.ts
export interface ProcessingMode {
  type: ProcessingModeType | `custom:${string}`
  value: string | string[]
  displayName: string
  // New fields for queue progression
  queueId?: string      // Current queue ID within mode
  queueIndex?: number   // Position in queue sequence
}

export type ProcessingModeType = 
  | 'project' 
  | 'priority' 
  | 'label' 
  | 'date' 
  | 'deadline' 
  | 'preset' 
  | 'all'
```

## Component Architecture

### 1. UnifiedDropdown Component
```typescript
// File: components/UnifiedDropdown.tsx
interface UnifiedDropdownProps {
  options: DropdownOption[]
  config: DropdownConfig
  value: string | string[]
  onChange: (value: string | string[], displayName: string) => void
  onOpen?: () => void
  onClose?: () => void
  className?: string
  disabled?: boolean
  ref?: React.Ref<UnifiedDropdownRef>
}

interface UnifiedDropdownRef {
  openDropdown: () => void
  closeDropdown: () => void
  focusInput?: () => void
}

// Component will handle:
// - Single/multi selection
// - Search functionality
// - Keyboard navigation
// - Count display
// - Icon rendering based on option type
// - Hierarchical display (only when defaultSort is used)
// - Automatic flattening when sorting is applied
```

### 2. Option Icon Renderer
```typescript
// File: components/OptionIcon.tsx
interface OptionIconProps {
  option: DropdownOption
  size?: 'sm' | 'md' | 'lg'
}

const OptionIcon: React.FC<OptionIconProps> = ({ option, size = 'md' }) => {
  switch (option.type) {
    case 'project':
      return <ProjectDot color={option.iconColor} size={size} />
    case 'priority':
      return <PriorityFlag priority={option.metadata?.priority} size={size} />
    case 'label':
      return <LabelIcon color={option.iconColor} size={size} />
    case 'date':
    case 'deadline':
    case 'preset':
      return <span className={`text-${size}`}>{option.icon}</span>
    default:
      return option.icon ? <span>{option.icon}</span> : null
  }
}
```

### 3. Next Queue Prompt Component
```typescript
// File: components/NextQueuePrompt.tsx
interface NextQueuePromptProps {
  currentQueue: DropdownOption
  nextQueue: DropdownOption
  onContinue: () => void
  onDismiss: () => void
  completedCount: number
  totalCount: number
}

// Renders:
// - Completion message for current queue
// - Next queue preview with icon and count
// - Keyboard shortcut hint
// - Continue/dismiss buttons
```

## Hook Architecture

### 1. useDropdownOptions Hook (Base)
```typescript
// File: hooks/useDropdownOptions.ts
interface UseDropdownOptionsProps {
  type: DropdownOptionType
  tasks: TodoistTask[]
  sortBy?: string
  excludeItems?: string[]
}

export const useDropdownOptions = (props: UseDropdownOptionsProps): DropdownOption[] => {
  // Base implementation for common logic
  // Specific hooks will extend this
}
```

### 2. Specific Option Provider Hooks
```typescript
// File: hooks/useProjectOptions.ts
export const useProjectOptions = (
  projects: TodoistProject[],
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] => {
  // Convert projects to DropdownOption[]
  // Calculate task counts
  
  // Hierarchy logic:
  if (config?.sortBy === 'default' || !config?.sortBy) {
    // Build hierarchy with parent-child relationships
    // Maintain Todoist's project order
    // Add children to parent's children array
  } else {
    // Flatten all projects for sorting
    // Apply sort (by name, priority, or count)
    // No children arrays - all at same level
  }
}

// File: hooks/usePriorityOptions.ts
export const usePriorityOptions = (
  tasks: TodoistTask[],
  config?: ModeConfig
): DropdownOption[] => {
  // Always returns 4 options (P1-P4)
  // Calculate counts for each priority
  // Apply reverse order if configured
}

// Similar hooks for labels, dates, deadlines, presets, all
```

### 3. useQueueProgression Hook
```typescript
// File: hooks/useQueueProgression.ts
export const useQueueProgression = (
  mode: ProcessingMode,
  dropdownOptions: DropdownOption[],
  config?: QueueConfiguration
) => {
  const [queueState, setQueueState] = useState<QueueState>({
    availableQueues: dropdownOptions,
    currentQueueIndex: 0,
    completedQueues: []
  })

  const moveToNextQueue = () => {
    setQueueState(prev => ({
      ...prev,
      currentQueueIndex: prev.currentQueueIndex + 1,
      completedQueues: [...prev.completedQueues, currentQueue.id]
    }))
  }

  const currentQueue = queueState.availableQueues[queueState.currentQueueIndex]
  const nextQueue = queueState.availableQueues[queueState.currentQueueIndex + 1]
  const hasNextQueue = queueState.currentQueueIndex < queueState.availableQueues.length - 1

  return {
    currentQueue,
    nextQueue,
    hasNextQueue,
    moveToNextQueue,
    queueProgress: {
      current: queueState.currentQueueIndex + 1,
      total: queueState.availableQueues.length
    }
  }
}
```

## Date and Deadline Queue Specifications

### Date Mode Options
```typescript
export const DATE_OPTIONS: DropdownOption[] = [
  { id: 'overdue', type: 'date', label: 'Overdue', icon: '🔴' },
  { id: 'today', type: 'date', label: 'Today', icon: '📅' },
  { id: 'tomorrow', type: 'date', label: 'Tomorrow', icon: '☀️' },
  { id: 'next_7_days', type: 'date', label: 'Next 7 Days', icon: '📆' },
  { id: 'future', type: 'date', label: 'Future', icon: '🔮' },
  { id: 'recurring', type: 'date', label: 'Recurring', icon: '🔄' }
]
```

### Deadline Mode Options
```typescript
export const DEADLINE_OPTIONS: DropdownOption[] = [
  { id: 'overdue', type: 'deadline', label: 'Overdue', icon: '🚨' },
  { id: 'today', type: 'deadline', label: 'Today', icon: '🎯' },
  { id: 'tomorrow', type: 'deadline', label: 'Tomorrow', icon: '📍' },
  { id: 'this_week', type: 'deadline', label: 'This Week', icon: '📌' },
  { id: 'this_month', type: 'deadline', label: 'This Month', icon: '🗓️' }
]
```

## Migration Strategy

### Phase 1 Migration Example: ProjectDropdown
```typescript
// OLD: ProjectDropdown.tsx
interface ProjectDropdownProps {
  projects: TodoistProject[]
  selectedProjectId: string
  onProjectChange: (projectId: string) => void
  allTasks: TodoistTask[]
}

// NEW: Using UnifiedDropdown
const ProjectSelector = ({ projects, selectedProjectId, onProjectChange, allTasks }) => {
  const projectOptions = useProjectOptions(projects, allTasks)
  
  return (
    <UnifiedDropdown
      options={projectOptions}
      config={{
        selectionMode: 'single',
        showSearch: true,
        showCounts: true,
        hierarchical: true
      }}
      value={selectedProjectId}
      onChange={(value, displayName) => onProjectChange(value as string)}
    />
  )
}
```

## Integration Points

### 1. ProcessingModeSelector Updates
```typescript
// Add queue progression tracking
const { currentQueue, nextQueue, hasNextQueue, moveToNextQueue } = useQueueProgression(
  mode,
  getCurrentDropdownOptions(mode.type)
)

// Update mode when moving to next queue
const handleNextQueue = () => {
  moveToNextQueue()
  onModeChange({
    ...mode,
    value: nextQueue.id,
    displayName: nextQueue.label,
    queueId: nextQueue.id,
    queueIndex: queueState.currentQueueIndex + 1
  })
}
```

### 2. TaskProcessor Integration
```typescript
// Detect when current queue is empty
useEffect(() => {
  if (activeQueue.length === 0 && currentTask === null && hasNextQueue) {
    setShowNextQueuePrompt(true)
  }
}, [activeQueue.length, currentTask, hasNextQueue])

// Handle continue to next queue
const handleContinueToNext = () => {
  setShowNextQueuePrompt(false)
  // ProcessingModeSelector handles the queue change
  processingModeSelectorRef.current?.moveToNextQueue()
}
```

## Testing Considerations

### 1. Unit Tests
- Test each option provider hook with various data sets
- Test UnifiedDropdown with different configurations
- Test queue progression logic
- Test icon rendering for all types

### 2. Integration Tests
- Test migration from old dropdowns to unified
- Test queue progression across different modes
- Test keyboard navigation
- Test search functionality

### 3. Performance Tests
- Test with large numbers of projects/labels
- Test count calculation performance
- Test search performance with many options

## Future Extensibility

### 1. Adding New Queue Types
1. Add new type to `DropdownOptionType`
2. Create option provider hook
3. Add icon rendering case
4. Update config types if needed

### 2. Custom Sort Functions
```typescript
const customSorts: Record<string, SortOption> = {
  projectPriority: {
    key: 'priority',
    label: 'Sort by Priority',
    sortFn: (a, b) => (b.metadata?.priority || 0) - (a.metadata?.priority || 0)
  },
  taskCount: {
    key: 'count',
    label: 'Sort by Task Count',
    sortFn: (a, b) => (b.count || 0) - (a.count || 0)
  },
  alphabetical: {
    key: 'name',
    label: 'Sort by Name',
    sortFn: (a, b) => a.label.localeCompare(b.label)
  }
}

// Note: All custom sorts will flatten hierarchical structures
// Only 'default' sort maintains parent-child relationships
```

### 3. Multi-Select Implementation (Phase 8)
```typescript
// Update UnifiedDropdown to handle array values
// Add checkbox UI elements
// Update onChange to handle selection arrays
// Update queue filtering to combine multiple selections
```