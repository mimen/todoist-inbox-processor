# Multi-List Architecture Issues and Solutions

## Current Architecture Problems

### 1. Dual Component Architecture
Currently, we have two separate components trying to manage similar functionality:
- **ListView**: Handles single list display with its own keyboard navigation, focus management, and state
- **MultiListContainer**: Wraps multiple ListView instances and tries to override their behavior

This creates fundamental conflicts because ListView wasn't designed to be controlled externally.

### 2. Focus Management Conflicts

#### Problem Details:
- **Multiple Focus Targets**: Each ListView has `tabIndex={0}`, creating multiple focusable elements
- **Auto-Focus Race**: ListView auto-highlights first task, competing with MultiListContainer's global highlight
- **Focus Stealing**: When lists mount, they try to focus themselves, causing viewport jumps

#### Code Examples:
```typescript
// ListView.tsx - Line 125-132
useEffect(() => {
  if (!listViewState.highlightedTaskId && sortedTasks.length > 0) {
    onListViewStateChange({
      ...listViewState,
      highlightedTaskId: sortedTasks[0].id
    })
  }
}, [sortedTasks.length, listViewState.highlightedTaskId, onListViewStateChange])

// MultiListContainer.tsx - Line 177-181
useEffect(() => {
  if (!globalHighlightedTaskId && allVisibleTasks.length > 0) {
    setGlobalHighlightedTaskId(allVisibleTasks[0].task.id)
  }
}, [allVisibleTasks.length])
```

### 3. Event Handling Conflicts

#### Problem Details:
- ListView has its own keyboard handler that checks `autoFocus` but still captures events
- Multiple `onKeyDown` handlers create unpredictable behavior
- Event propagation issues between nested components

### 4. State Synchronization Issues

#### Problem Details:
The current state synchronization in `handleListViewStateChange` is broken:

```typescript
// Line 307-317 in MultiListContainer
const handleListViewStateChange = useCallback((newState: ListViewState) => {
  if (newState.highlightedTaskId !== listViewState.highlightedTaskId) {
    setGlobalHighlightedTaskId(newState.highlightedTaskId)
  }
  onListViewStateChange({
    ...newState,
    highlightedTaskId: listViewState.highlightedTaskId // BUG: Always uses old value
  })
}, [listViewState, onListViewStateChange])
```

This creates a three-way state sync problem between:
1. Parent component's `listViewState`
2. MultiListContainer's `globalHighlightedTaskId`
3. Individual ListView's understanding of highlight

## Proposed Solution: Unified List Architecture

### Option 1: Single ListView Component (Recommended)

Transform ListView to handle both single and multi-list modes internally.

#### Benefits:
- Single source of truth for keyboard navigation
- No state synchronization issues
- Consistent behavior between modes
- Simpler mental model

#### Implementation:
```typescript
interface ListViewProps {
  // For single list mode
  tasks?: TodoistTask[]
  processingMode?: ProcessingMode
  
  // For multi-list mode
  lists?: Array<{
    id: string
    label: string
    icon?: string
    tasks: TodoistTask[]
    processingMode: ProcessingMode
  }>
  
  // Shared props
  multiListMode: boolean
  visibleListCount?: number
  onLoadMore?: () => void
  // ... other shared props
}
```

The component would:
1. Render single list if `tasks` provided
2. Render multiple lists if `lists` provided
3. Handle all keyboard navigation internally
4. Manage single global highlight state
5. Provide "Load More" functionality when needed

### Option 2: Headless List Controller

Create a headless component that manages state and keyboard navigation, with presentation components for rendering.

#### Architecture:
```typescript
// Headless controller
function useListViewController(props: ListViewControllerProps) {
  // All state management
  // All keyboard handling
  // All business logic
  
  return {
    highlightedTaskId,
    selectedTaskIds,
    handlers: {
      onKeyDown,
      onTaskClick,
      // etc
    },
    // ... other state and methods
  }
}

// Presentation components
function SingleListView({ controller, tasks, ... }) {
  // Just rendering, no state or event handling
}

function MultiListView({ controller, lists, ... }) {
  // Just rendering, no state or event handling
}
```

### Option 3: Enhanced MultiListContainer (Quick Fix)

If we need to keep the current architecture, we need to:

1. **Disable ALL ListView interactivity in multi-list mode**:
```typescript
// In ListView when autoFocus={false}:
- Remove tabIndex
- Remove onKeyDown handler
- Disable auto-highlight effect
- Disable focus management
- Make it purely presentational
```

2. **Fix state synchronization**:
```typescript
const handleListViewStateChange = useCallback((newState: ListViewState) => {
  // Handle all state changes properly
  if (newState.highlightedTaskId !== globalHighlightedTaskId) {
    setGlobalHighlightedTaskId(newState.highlightedTaskId)
  }
  
  onListViewStateChange({
    ...newState,
    highlightedTaskId: globalHighlightedTaskId // Use global, not old parent state
  })
}, [globalHighlightedTaskId, onListViewStateChange])
```

3. **Prevent focus races**:
```typescript
// In ListView
useEffect(() => {
  if (autoFocus && !listViewState.highlightedTaskId && sortedTasks.length > 0) {
    onListViewStateChange({
      ...listViewState,
      highlightedTaskId: sortedTasks[0].id
    })
  }
}, []) // Run only on mount, not on every change
```

## Recommendation

I strongly recommend **Option 1: Single ListView Component**. This would:

1. Eliminate all synchronization issues
2. Provide consistent behavior
3. Reduce code complexity
4. Make future features easier to implement
5. Improve performance (single keyboard handler, single focus target)

The refactor would involve:
1. Moving MultiListContainer logic into ListView
2. Adding a `multiListMode` prop
3. Conditionally rendering single vs multiple lists
4. Keeping all keyboard and focus management in one place

This aligns with your goal of making single and multi-list view "the same thing" - they would literally be the same component with different data.