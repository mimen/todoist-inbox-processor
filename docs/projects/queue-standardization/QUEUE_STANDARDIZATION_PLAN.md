# Queue Standardization and Next-Queue Feature Plan

## Current State Analysis

### Dropdown Components Overview
The application currently has 8 distinct dropdown components, each handling different filtering/sorting scenarios:

1. **FilterDropdown** - Todoist saved filters
2. **PriorityDropdown** - Priority levels (P1-P4)
3. **ProjectDropdown** - Projects with hierarchy
4. **LabelDropdown** - Multi-select labels
5. **DateDropdown** - Scheduled date ranges
6. **DeadlineDropdown** - Deadline date ranges
7. **PresetDropdown** - Smart filter presets
8. **AllTasksDropdown** - All mode for viewing all tasks with sort options

### Common Patterns
- All use `forwardRef` with imperative handle
- Consistent UI styling (gray backgrounds, blue selection, chevron icons)
- Keyboard navigation support (arrow keys, enter, escape)
- Count calculation and display
- Click-outside detection

### Key Differences
- **Data Sources**: Static (Priority, Date, Deadline) vs Dynamic (Project, Label)
- **Selection Type**: Single vs Multi-select (only Labels)
- **Special Features**: Search (Project, Label), Hierarchy (Project), Complex filtering (Preset)

### Current Queue Architecture
The TaskProcessor uses a sophisticated queue system:
- **Master Tasks Store**: All tasks indexed by ID
- **Task Queue**: Array of task IDs in processing order
- **Active Queue**: Filtered queue excluding processed tasks
- **Position Tracking**: Current position in active queue
- **Processed Task IDs**: Tasks marked as processed (not deleted)

## Vision: Next-Queue Feature

### User Experience
When a user finishes processing all tasks in the current queue (e.g., Inbox):
1. Display a "Keep going?" prompt with the next queue option
2. Show the next queue with appropriate icon and count
3. Include keyboard shortcut hint (e.g., "Press → to continue")
4. Seamless transition to the next queue

### Queue Progression Principle
**Queue order follows dropdown order exactly**. If a dropdown is sorted (future feature), the progression follows that sort order:
- **Project Mode**: Follows project dropdown order (which could be sorted by name, priority, task count, etc.)
- **Priority Mode**: P1 → P2 → P3 → P4 (fixed order)
- **Label Mode**: Follows label dropdown order (currently sorted by count)
- **Date Mode**: Overdue → Today → Tomorrow → Next 7 Days (fixed order)

Empty queues are still shown in the progression (not skipped).

## Proposed Architecture Changes

### 1. Standardized Dropdown Option Interface
```typescript
interface DropdownOption {
  id: string
  label: string
  icon?: React.ReactNode | string  // Supports mixed icons (dots, flags, emojis)
  iconColor?: string
  count?: number
  description?: string
  metadata?: any
  children?: DropdownOption[] // For hierarchical items
  type?: 'project' | 'priority' | 'label' | 'date' | 'deadline' | 'preset' | 'filter' | 'sort'
}

interface DropdownConfig {
  selectionMode: 'single' | 'multi'  // Now any dropdown can be multi-select!
  showSearch?: boolean
  showCounts?: boolean
  hierarchical?: boolean
  sortOptions?: Array<{
    key: string
    label: string
    sortFn: (a: DropdownOption, b: DropdownOption) => number
  }>
  defaultSort?: string
}
```

### 2. Unified Dropdown Component
Create a single `UnifiedDropdown` component that accepts:
- `options: DropdownOption[]`
- `config: DropdownConfig`
- `value: string | string[]`
- `onChange: (value: string | string[], option: DropdownOption) => void`

### 3. Option Providers
Create standardized option providers for each type:
```typescript
// Example for projects
const useProjectOptions = (projects: TodoistProject[], tasks: TodoistTask[]): DropdownOption[] => {
  return projects.map(project => ({
    id: project.id,
    label: project.name,
    icon: <ProjectIcon color={project.color} />,
    count: calculateProjectCount(project.id, tasks),
    metadata: { project }
  }))
}
```

### 4. Queue State Management
Mirror the current task queue architecture - maintain queue state similar to how we maintain task state:

```typescript
interface QueueState {
  // All available queues for current mode (like masterTasks)
  availableQueues: DropdownOption[]
  // Current position in queue sequence (like queuePosition)
  currentQueueIndex: number
  // Completed queue IDs (like processedTaskIds)
  completedQueues: string[]
  // Queue sorting/filtering config (loaded from JSON)
  queueConfig?: QueueConfiguration
}

// Hook that manages queue progression
const useQueueProgression = (mode: ProcessingMode, dropdownOptions: DropdownOption[]) => {
  const [queueState, setQueueState] = useState<QueueState>()
  
  return {
    currentQueue: queueState.availableQueues[queueState.currentQueueIndex],
    nextQueue: queueState.availableQueues[queueState.currentQueueIndex + 1],
    hasNextQueue: queueState.currentQueueIndex < queueState.availableQueues.length - 1,
    moveToNextQueue: () => setQueueState(prev => ({
      ...prev,
      currentQueueIndex: prev.currentQueueIndex + 1
    }))
  }
}
```

**Key Decision**: Queue state lives in TaskProcessor (like task queue state), not in ProcessingModeSelector. This allows:
- Consistent state management pattern
- Easy access to queue progression from keyboard shortcuts
- Clear data flow from dropdowns → queue state → UI

### 5. JSON-Based Queue Configuration

#### Core Concept: Standard Modes Have Fixed Behaviors
Each mode type has its own fixed behavior and options:

**Projects Mode:**
- Shows all your Todoist projects
- Default order: Same as Todoist (parent → child hierarchy)
- What you can customize: Sort order only

**Priority Mode:**
- Shows 4 queues: P1, P2, P3, P4
- Default order: P1 → P2 → P3 → P4
- What you can customize: Reverse order, hide empty priorities

**Label Mode:**
- Shows all your labels
- Default order: By task count (most tasks first)
- What you can customize: Sort order, exclude specific labels
- Currently multi-select, but could be single-select too

**Date Mode (Scheduled Dates):**
- Shows 6 fixed queues: Overdue, Today, Tomorrow, Next 7 Days, Future (beyond 7 days), Recurring Tasks
- Cannot add/remove date ranges (these are hardcoded)
- What you can customize: Hide empty ranges
- Special: Recurring tasks can be filtered separately

**Deadline Mode:**
- Shows 5 fixed queues: Overdue, Today, Tomorrow, This Week, This Month
- Cannot add/remove ranges (these are hardcoded)
- What you can customize: Hide empty ranges
- Note: No recurring filter (deadlines don't recur)

#### Simple Configuration File
```json
// queue-config.json
{
  // Customize standard modes (all optional)
  "standardModes": {
    "project": {
      "sortBy": "default",  // default | name | priority | taskCount
      "multiSelect": false   // Could enable multi-select for projects
    },
    "priority": {
      "reverseOrder": false,  // Show P4 → P3 → P2 → P1
      "hideEmpty": false,
      "multiSelect": false
    },
    "label": {
      "sortBy": "count",  // count | name
      "excludeLabels": ["personal", "archive"],
      "multiSelect": true  // Already true by default
    },
    "date": {
      "hideEmpty": false
      // Cannot change which ranges appear
    },
    "deadline": {
      "hideEmpty": false
      // Cannot change which ranges appear
    }
  },
  
  // Create custom queue sequences
  "customQueues": [
    {
      "id": "morning-review",
      "name": "Morning Review",
      "icon": "☀️",
      "sequence": [
        { "type": "project", "id": "inbox" },
        { "type": "priority", "id": "4" },  // P1 tasks
        { "type": "label", "id": "urgent" }
      ]
    },
    {
      "id": "focus-session",
      "name": "Focus Session",
      "icon": "🎯",
      "sequence": [
        { "type": "label", "id": "deep-work" },
        { "type": "project", "id": "2234567890" }  // Specific project
      ]
    }
  ]
}
```

#### Without Any Config:
Everything works with these defaults:
- **Projects**: Your Todoist project order, single-select
- **Priorities**: P1 → P2 → P3 → P4, single-select
- **Labels**: Sorted by task count, multi-select
- **Dates**: Overdue → Today → Tomorrow → Next 7 Days → Future → Recurring, single-select
- **Deadlines**: Overdue → Today → Tomorrow → This Week → This Month, single-select
- All queues show even if empty

#### With Config:
You can customize specific things:
```typescript
// Example: Sort projects by priority instead of Todoist order
if (config.standardModes.project.sortBy === 'priority') {
  // Projects with P1 priority show first
}

// Example: Enable multi-select for priorities
if (config.standardModes.priority.multiSelect) {
  // Can select P1 AND P2 at the same time
}
```

#### Multi-Select vs Single-Select:
The `multiSelect` option could work for any mode:
- **Single-select** (default for most): Process tasks from ONE queue at a time
- **Multi-select** (currently only labels): Process tasks from MULTIPLE queues combined

Examples:
- Projects multi-select: Work on "Work" AND "Personal" projects together
- Priority multi-select: See all P1 AND P2 tasks in one view
- Date multi-select: Process "Today" AND "Tomorrow" tasks together

### 6. Next Queue UI Component
```typescript
interface NextQueuePromptProps {
  nextQueue: DropdownOption
  onContinue: () => void
  onDismiss: () => void
  mode: ProcessingModeType
}

// Renders with appropriate icon based on queue type
<NextQueuePrompt>
  <div className="flex items-center gap-3">
    <span>Keep going? Process</span>
    {nextQueue.type === 'project' && <ProjectDot color={nextQueue.iconColor} />}
    {nextQueue.type === 'priority' && <PriorityFlag priority={nextQueue.metadata.priority} />}
    {nextQueue.type === 'label' && <LabelIcon color={nextQueue.iconColor} />}
    <span>{nextQueue.label}</span>
    <span className="text-gray-500">({nextQueue.count} tasks)</span>
  </div>
  <span className="text-sm text-gray-500">Press → to continue</span>
</NextQueuePrompt>
```

## Implementation Plan

### Phase 1: Create Core Interfaces and Types (1 day)
1. Define `DropdownOption` interface with type field for mixed icon support
2. Create `QueueState` and `QueueConfiguration` types
3. Set up types for future features (sort options, custom order)
4. Create initial queue-config.json structure

### Phase 2: Build Option Providers (2 days)
1. Create a base `useDropdownOptions` hook that all providers extend
2. Implement specific providers that return `DropdownOption[]`:
   ```typescript
   useProjectOptions(projects, tasks) => DropdownOption[]
   usePriorityOptions(tasks) => DropdownOption[]
   useLabelOptions(labels, tasks) => DropdownOption[]
   // etc...
   ```
3. Ensure each provider includes proper type field for icon rendering
4. Standardize count calculation across all providers

### Phase 3: Create Unified Dropdown Component (3 days)
1. Build `UnifiedDropdown` that handles all current features
2. Create icon rendering system based on option type:
   ```typescript
   const OptionIcon = ({ option }: { option: DropdownOption }) => {
     switch (option.type) {
       case 'project': return <ProjectDot color={option.iconColor} />
       case 'priority': return <PriorityFlag priority={option.metadata.priority} />
       case 'label': return <LabelIcon color={option.iconColor} />
       // etc...
     }
   }
   ```
3. Implement dropdown config support (search, multi-select, hierarchy)
4. Add hooks for future sort options without implementing them yet

### Phase 4: Migrate Existing Dropdowns (3 days)
1. Replace dropdowns one at a time with UnifiedDropdown
2. Maintain exact same behavior as current dropdowns
3. Keep existing refs and imperative handles working
4. Test thoroughly after each migration

### Phase 5: Implement Queue Progression (2 days)
1. Create `useQueueProgression` hook
2. Integrate with ProcessingModeSelector
3. Track queue position alongside task position
4. Ensure queue order follows dropdown order exactly

### Phase 6: Add Next Queue UI (2 days)
1. Create `NextQueuePrompt` component with mixed icon support
2. Detect when active queue is empty
3. Show prompt with keyboard hints
4. Implement smooth transitions
5. Handle edge cases (last queue, mode switching)

### Phase 7: Future-Proofing (1 day)
1. Add JSON loading infrastructure (but use hardcoded config for now)
2. Add sort option interfaces (but don't implement UI)
3. Document how to add custom queues later
4. Create placeholder for state persistence

### Phase 8: Multi-Select Support (Future - 2 days)
1. Update UnifiedDropdown to support multi-select mode
2. Add checkbox UI for multi-select dropdowns
3. Update queue processing to handle arrays of selected items
4. Test with labels first, then expand to other modes

## Obstacles and Considerations

### Technical Challenges
1. **Backward Compatibility**: Need to migrate gradually without breaking existing functionality
2. **Performance**: Ensure count calculations remain efficient with large task lists
3. **State Management**: Complex state transitions when switching queues
4. **Type Safety**: Maintaining TypeScript safety with generic interfaces

### UX Challenges
1. **Queue Order**: Determining optimal queue progression order
2. **User Control**: Allowing users to skip or reorder queues
3. **Progress Indication**: Showing overall progress across all queues
4. **Interruption Handling**: What happens if user switches modes mid-queue?

### Data Challenges
1. **Dynamic Counts**: Counts change as tasks are processed
2. **Filtering Consistency**: Maintaining filter state across queue transitions
3. **Assignee Filtering**: Preserving assignee filter when switching queues

## Benefits of Standardization

1. **Consistency**: Uniform behavior across all dropdowns
2. **Maintainability**: Single source of truth for dropdown logic
3. **Extensibility**: Easy to add new queue types
4. **Custom Queues**: Foundation for mixed-type queues (e.g., "P1 tasks in specific projects")
5. **Smart Filters**: Ability to create complex filter combinations
6. **Better Testing**: Centralized logic easier to test

## Designing for Future Features

### 1. Mixed Mode Queues (Future)
The architecture supports this through:
- Unified `DropdownOption` type that works across all modes
- Icon rendering based on option type
- JSON configuration for custom queue sequences

Example future implementation:
```typescript
// Custom morning review queue mixing different types
const morningQueue: DropdownOption[] = [
  { id: 'inbox', type: 'project', label: 'Inbox', icon: '📥' },
  { id: '4', type: 'priority', label: 'P1 Tasks', icon: <PriorityFlag priority={4} /> },
  { id: 'work', type: 'project', label: 'Work Project', icon: <ProjectDot color="blue" /> }
]
```

### 2. Dropdown Sorting (Future)
Built-in support through:
- `sortOptions` in `DropdownConfig`
- Option providers can accept sort parameters
- Queue progression automatically follows sorted order

### 3. State Persistence (Future)
Prepared through:
- `completedQueues` tracking in `QueueState`
- Queue position tracking separate from task position
- JSON configuration loading infrastructure

### 4. Custom Queue Builder UI (Future)
Foundation laid through:
- Standardized option format
- JSON-based configuration
- Mixed type support

## Benefits of This Comprehensive Approach

1. **Immediate Benefits**:
   - Consistent dropdown behavior and appearance
   - Automatic "next queue" feature following dropdown order
   - Cleaner, more maintainable code
   - Better TypeScript type safety

2. **Future Flexibility**:
   - Easy to add dropdown sorting without changing queue logic
   - Mixed queues "just work" with the unified system
   - Custom queues through JSON without code changes
   - State persistence hooks already in place

3. **Developer Experience**:
   - Single component to maintain instead of 8
   - Standardized way to add new dropdown types
   - Clear separation of concerns (options, display, behavior)
   - Easier testing with unified interfaces

4. **User Experience**:
   - Consistent keyboard navigation
   - Familiar UI patterns across all dropdowns
   - Smooth queue progression
   - Visual consistency with mixed icons

## Next Steps

1. Review and refine this plan with the team
2. Create detailed technical specifications for interfaces
3. Set up development branch for the migration
4. Begin with Phase 1: Interface definitions
5. Create migration guide for each dropdown component