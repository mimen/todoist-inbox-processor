# List View Feature - Technical Architecture & Implementation Design

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Component Architecture](#component-architecture)
4. [State Management Design](#state-management-design)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Performance Optimization Strategy](#performance-optimization-strategy)
7. [Integration Points](#integration-points)
8. [Migration Strategy](#migration-strategy)
9. [Testing Approach](#testing-approach)
10. [Technical Decisions](#technical-decisions)
11. [Risk Mitigation](#risk-mitigation)
12. [Implementation Roadmap](#implementation-roadmap)

## Executive Summary

The List View feature adds a new viewing mode to the task processor application, allowing users to see all tasks in their current queue as a condensed, scannable list. This architecture leverages the existing queue management system while introducing minimal changes to the current codebase.

### Key Design Principles
- **Reuse Over Rebuild**: Maximize use of existing data structures and logic
- **Progressive Enhancement**: Start simple, add complexity as needed
- **Performance First**: Design for large datasets from the beginning
- **Seamless Integration**: Maintain compatibility with all existing features

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TaskProcessor                          │
│  ┌─────────────────┐                 ┌──────────────────┐  │
│  │  ViewModeToggle │                 │  State Manager   │  │
│  └────────┬────────┘                 └────────┬─────────┘  │
│           │                                    │            │
│  ┌────────▼─────────────────────────┬─────────▼────────┐  │
│  │   ProcessingView (existing)      │    ListView (new) │  │
│  │  ┌─────────────┐                │  ┌──────────────┐ │  │
│  │  │  TaskCard   │                │  │ ListHeader   │ │  │
│  │  │  TaskForm   │                │  │ VirtualList  │ │  │
│  │  │  Overlays   │                │  │ TaskListItem │ │  │
│  │  └─────────────┘                │  └──────────────┘ │  │
│  └──────────────────────────────────┴──────────────────┘  │
│                              │                             │
│  ┌───────────────────────────▼──────────────────────────┐  │
│  │              Shared Queue Architecture                │  │
│  │   masterTasks | taskQueue | activeQueue | filters    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **View Mode as Top-Level State**: View mode is managed at the TaskProcessor level, allowing seamless switching
2. **Shared Data Layer**: Both views use the same queue architecture and master task store
3. **Lazy Component Loading**: List View components are code-split for initial bundle size optimization
4. **Virtual Scrolling by Default**: Handle large datasets efficiently from day one

## Component Architecture

### New Components

#### 1. ViewModeToggle
```typescript
interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  taskCount: number;
  isLoading?: boolean;
}

// Features:
// - Animated toggle between views
// - Task count display
// - Keyboard shortcut hint (V)
// - Loading state indication
```

#### 2. ListView Container
```typescript
interface ListViewProps {
  // Data props
  tasks: TodoistTask[];
  masterTasks: Record<string, TodoistTask>;
  activeQueue: string[];
  
  // Context props
  projects: TodoistProject[];
  labels: TodoistLabel[];
  processingMode: ProcessingMode;
  projectMetadata: Record<string, any>;
  collaborators: CollaboratorsData;
  
  // UI state
  expandedTaskIds: Set<string>;
  selectedTaskIds: Set<string>;
  sortBy: SortOption;
  groupBy: GroupOption;
  
  // Callbacks
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskProcess: (taskId: string) => void;
  onViewModeChange: (mode: 'processing') => void;
  onNavigateQueue: (direction: 'prev' | 'next') => void;
}
```

#### 3. TaskListItem
```typescript
interface TaskListItemProps {
  taskId: string;
  task: TodoistTask;
  project?: TodoistProject;
  labels: TodoistLabel[];
  assignee?: TodoistUser;
  
  // Display control
  visibleColumns: ColumnVisibility;
  isExpanded: boolean;
  isSelected: boolean;
  isFocused: boolean;
  
  // Interaction callbacks
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onComplete: () => void;
  onProcess: () => void;
  onUpdate: (updates: TaskUpdate) => void;
  onDoubleClick: () => void;
}
```

#### 4. ListHeader
```typescript
interface ListHeaderProps {
  processingMode: ProcessingMode;
  taskCount: number;
  selectedCount: number;
  sortBy: SortOption;
  groupBy: GroupOption;
  onSortChange: (sort: SortOption) => void;
  onGroupChange: (group: GroupOption) => void;
  onBulkAction?: (action: BulkAction) => void;
}
```

### Modified Components

#### TaskProcessor Component Updates
```typescript
// New state additions
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  // Load from localStorage or default to 'processing'
  return localStorage.getItem('taskProcessor.viewMode') as ViewMode || 'processing';
});

const [listViewState, setListViewState] = useState<ListViewState>({
  expandedTaskIds: new Set(),
  selectedTaskIds: new Set(),
  sortBy: 'default',
  groupBy: 'none',
  focusedTaskId: null,
});

// Persist view mode preference
useEffect(() => {
  localStorage.setItem('taskProcessor.viewMode', viewMode);
}, [viewMode]);
```

## State Management Design

### State Architecture

```typescript
// Types
type ViewMode = 'processing' | 'list';

interface ListViewState {
  expandedTaskIds: Set<string>;
  selectedTaskIds: Set<string>;
  sortBy: SortOption;
  groupBy: GroupOption;
  focusedTaskId: string | null;
}

// State location strategy:
// 1. View mode: TaskProcessor level (persisted)
// 2. List UI state: TaskProcessor level (session only)
// 3. Task data: Existing queue architecture (shared)
// 4. Column visibility: Computed from processingMode
```

### State Synchronization

```typescript
// Ensure state consistency between views
const syncViewStates = useCallback(() => {
  if (viewMode === 'list' && currentTask) {
    // When switching to list view, ensure current task is visible
    setListViewState(prev => ({
      ...prev,
      focusedTaskId: currentTask.id,
      expandedTaskIds: new Set([...prev.expandedTaskIds, currentTask.id])
    }));
  }
}, [viewMode, currentTask]);
```

## Data Flow Architecture

### Task Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   API/Sync  │────▶│ masterTasks  │────▶│  taskQueue  │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                    ┌──────────────┐             │
                    │ activeQueue  │◀────────────┘
                    └──────┬───────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
    ┌────▼─────┐                      ┌─────▼────┐
    │Processing│                      │   List   │
    │   View   │                      │   View   │
    └──────────┘                      └──────────┘
```

### Update Flow

```typescript
// Centralized update handler used by both views
const handleTaskUpdate = useCallback(async (taskId: string, updates: TaskUpdate) => {
  // 1. Optimistic update to master store
  setMasterTasks(prev => ({
    ...prev,
    [taskId]: { ...prev[taskId], ...updates }
  }));
  
  // 2. API call
  try {
    await autoSaveTask(taskId, updates);
  } catch (error) {
    // 3. Revert on failure
    setMasterTasks(prev => ({
      ...prev,
      [taskId]: originalTask
    }));
  }
}, [autoSaveTask]);
```

## Performance Optimization Strategy

### 1. Virtual Scrolling Implementation

```typescript
import { VariableSizeList } from 'react-window';

const VirtualTaskList: React.FC<VirtualTaskListProps> = ({ 
  tasks, 
  expandedTaskIds,
  ...props 
}) => {
  // Dynamic row height based on expanded state
  const getItemSize = useCallback((index: number) => {
    const taskId = tasks[index].id;
    if (expandedTaskIds.has(taskId)) {
      return EXPANDED_ROW_HEIGHT; // ~150px
    }
    return COMPACT_ROW_HEIGHT; // ~48px
  }, [tasks, expandedTaskIds]);

  // Reset cache when expanded state changes
  const listRef = useRef<VariableSizeList>(null);
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [expandedTaskIds]);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <VariableSizeList
          ref={listRef}
          height={height}
          width={width}
          itemCount={tasks.length}
          itemSize={getItemSize}
          overscanCount={5}
          itemData={{ tasks, ...props }}
        >
          {MemoizedTaskRow}
        </VariableSizeList>
      )}
    </AutoSizer>
  );
};
```

### 2. Memoization Strategy

```typescript
// Memoized task row component
const TaskRow = memo(({ index, style, data }: ListChildComponentProps) => {
  const { tasks, expandedTaskIds, onTaskUpdate, ...props } = data;
  const task = tasks[index];
  
  return (
    <div style={style}>
      <TaskListItem
        key={task.id}
        taskId={task.id}
        task={task}
        isExpanded={expandedTaskIds.has(task.id)}
        {...props}
      />
    </div>
  );
}, areEqual);

// Custom comparison function
function areEqual(prevProps: any, nextProps: any): boolean {
  const prevTask = prevProps.data.tasks[prevProps.index];
  const nextTask = nextProps.data.tasks[nextProps.index];
  
  // Only re-render if task data or expansion state changes
  return (
    prevTask.id === nextTask.id &&
    prevTask.content === nextTask.content &&
    prevTask.priority === nextTask.priority &&
    prevProps.data.expandedTaskIds.has(prevTask.id) === 
    nextProps.data.expandedTaskIds.has(nextTask.id)
  );
}
```

### 3. Data Transformation Optimization

```typescript
// Compute sorted/grouped data with memoization
const processedTasks = useMemo(() => {
  // 1. Apply sorting
  let result = sortTasks([...activeQueue.map(id => masterTasks[id])], sortBy);
  
  // 2. Apply grouping
  if (groupBy !== 'none') {
    return groupTasks(result, groupBy, projectMetadata);
  }
  
  return [{ id: 'all', title: '', tasks: result }];
}, [activeQueue, masterTasks, sortBy, groupBy, projectMetadata]);

// Flatten for virtual list
const flatTasks = useMemo(() => {
  return processedTasks.flatMap(group => [
    { type: 'header', ...group },
    ...group.tasks.map(task => ({ type: 'task', ...task }))
  ]);
}, [processedTasks]);
```

### 4. Lazy Loading Strategy

```typescript
// Code-split ListView components
const ListView = lazy(() => import('./ListView'));

// In TaskProcessor render:
{viewMode === 'list' ? (
  <Suspense fallback={<ListViewSkeleton />}>
    <ListView {...listViewProps} />
  </Suspense>
) : (
  <ProcessingView {...processingViewProps} />
)}
```

## Integration Points

### 1. Queue System Integration

```typescript
// ListView receives same queue data as ProcessingView
const listViewProps = {
  tasks: activeQueue.map(id => masterTasks[id]).filter(Boolean),
  masterTasks,
  activeQueue,
  processingMode,
  projectMetadata,
  // ... other shared props
};
```

### 2. Navigation Integration

```typescript
// Update navigation to work with ListView
const handleNavigateQueue = useCallback((direction: 'prev' | 'next') => {
  if (viewMode === 'list') {
    // In list view, immediately load new queue
    const queueState = processingModeSelectorRef.current?.queueState;
    if (direction === 'next' && queueState?.hasNextQueue) {
      queueState.moveToNextQueue();
      loadTasksForMode(newMode);
    }
  } else {
    // In processing view, use existing navigation
    direction === 'next' ? navigateToNextTask() : navigateToPrevTask();
  }
}, [viewMode]);
```

### 3. Keyboard Shortcuts Integration

```typescript
// Add view-specific shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Global shortcuts
    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      setViewMode(prev => prev === 'processing' ? 'list' : 'processing');
      return;
    }

    // View-specific shortcuts
    if (viewMode === 'list') {
      handleListViewShortcuts(e);
    } else {
      handleProcessingViewShortcuts(e);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [viewMode]);
```

### 4. Overlay Integration

```typescript
// Overlays work with both views
const handleOverlayAction = useCallback((action: string, data: any) => {
  if (viewMode === 'list' && listViewState.focusedTaskId) {
    // Apply to focused task in list view
    handleTaskUpdate(listViewState.focusedTaskId, data);
  } else if (viewMode === 'processing' && currentTask) {
    // Apply to current task in processing view
    handleTaskUpdate(currentTask.id, data);
  }
}, [viewMode, listViewState.focusedTaskId, currentTask]);
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Add ViewMode type and state to TaskProcessor
2. Create ViewModeToggle component
3. Implement basic ListView container
4. Set up conditional rendering

### Phase 2: Core Features (Week 2)
1. Implement TaskListItem component
2. Add context-aware column visibility
3. Basic expand/collapse functionality
4. Integration with existing update handlers

### Phase 3: Performance (Week 3)
1. Implement virtual scrolling
2. Add memoization optimizations
3. Lazy loading for ListView
4. Performance monitoring

### Phase 4: Enhanced Features (Week 4)
1. Sorting implementation
2. Grouping functionality
3. Keyboard navigation
4. Bulk selection UI (no actions yet)

### Feature Flag Implementation

```typescript
// Environment-based feature flag
const FEATURES = {
  LIST_VIEW: process.env.NEXT_PUBLIC_ENABLE_LIST_VIEW === 'true',
  LIST_VIEW_DEFAULT: process.env.NEXT_PUBLIC_LIST_VIEW_DEFAULT === 'true',
};

// Gradual rollout
const isListViewEnabled = () => {
  if (!FEATURES.LIST_VIEW) return false;
  
  // A/B testing logic
  const userId = collaboratorsData?.currentUser?.id;
  if (userId) {
    const bucket = parseInt(userId) % 100;
    return bucket < rolloutPercentage;
  }
  
  return false;
};
```

## Testing Approach

### Unit Testing Strategy

```typescript
// Component tests
describe('ListView', () => {
  it('renders all tasks from active queue', () => {
    const tasks = generateMockTasks(20);
    render(<ListView tasks={tasks} {...defaultProps} />);
    expect(screen.getAllByTestId('task-list-item')).toHaveLength(20);
  });

  it('respects column visibility based on processing mode', () => {
    const props = {
      ...defaultProps,
      processingMode: { type: 'project', value: 'p1' }
    };
    render(<ListView {...props} />);
    expect(screen.queryByTestId('project-column')).not.toBeInTheDocument();
  });

  it('maintains task selection across sorting', () => {
    const { rerender } = render(<ListView {...defaultProps} />);
    fireEvent.click(screen.getByTestId('task-1'));
    
    rerender(<ListView {...defaultProps} sortBy="priority" />);
    expect(screen.getByTestId('task-1')).toHaveClass('selected');
  });
});
```

### Integration Testing

```typescript
describe('View Mode Integration', () => {
  it('preserves queue state when switching views', async () => {
    render(<TaskProcessor />);
    
    // Process some tasks
    fireEvent.click(screen.getByText('Process'));
    fireEvent.click(screen.getByText('Process'));
    
    // Switch to list view
    fireEvent.click(screen.getByTestId('view-toggle-list'));
    
    // Verify processed tasks are marked
    expect(screen.getByTestId('task-1')).toHaveClass('processed');
    expect(screen.getByTestId('task-2')).toHaveClass('processed');
  });
});
```

### Performance Testing

```typescript
// Performance benchmarks
describe('List View Performance', () => {
  it('renders 500 tasks within 200ms', async () => {
    const tasks = generateMockTasks(500);
    const start = performance.now();
    
    render(<ListView tasks={tasks} {...defaultProps} />);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(200);
  });

  it('maintains 60fps during scroll', async () => {
    // Use Puppeteer or Cypress for real scroll performance testing
  });
});
```

## Technical Decisions

### Decision Log

1. **Virtual Scrolling Library**: react-window
   - **Rationale**: Mature, well-maintained, small bundle size
   - **Alternative**: react-virtualized (larger, more features we don't need)

2. **State Management**: Component state with lifting
   - **Rationale**: Aligns with existing patterns, no need for external store
   - **Alternative**: Context API (overkill for this feature)

3. **Memoization Strategy**: Selective with React.memo
   - **Rationale**: Balance between performance and complexity
   - **Alternative**: Aggressive memoization (diminishing returns)

4. **Column Visibility**: Computed, not stored
   - **Rationale**: Always in sync with processing mode
   - **Alternative**: User preferences (future enhancement)

5. **Group/Sort State**: Session-only
   - **Rationale**: Reduce complexity, natural reset on refresh
   - **Alternative**: Persist per queue type (future enhancement)

## Risk Mitigation

### Performance Risks

**Risk**: Performance degradation with 1000+ tasks
- **Mitigation**: Virtual scrolling from day one
- **Monitoring**: Performance marks on render
- **Fallback**: Pagination at 1000 tasks

**Risk**: Memory leaks from event listeners
- **Mitigation**: Proper cleanup in useEffect
- **Testing**: Memory profiling in dev tools

### UX Risks

**Risk**: Users confused by view toggle
- **Mitigation**: Clear visual indicator, onboarding tooltip
- **Monitoring**: Track toggle usage analytics

**Risk**: Lost context when switching views
- **Mitigation**: Maintain focus on current task
- **Testing**: User testing with prototypes

### Technical Risks

**Risk**: State synchronization issues
- **Mitigation**: Single source of truth (masterTasks)
- **Testing**: Integration tests for edge cases

**Risk**: Bundle size increase
- **Mitigation**: Code splitting, tree shaking
- **Monitoring**: Bundle analysis on each build

## Implementation Roadmap

### Week 1: Foundation
- [ ] Add ViewMode state and persistence
- [ ] Create ViewModeToggle component
- [ ] Basic ListView container
- [ ] Simple TaskListItem (no interactions)
- [ ] Context-aware columns

### Week 2: Interactions
- [ ] Expand/collapse tasks
- [ ] Click interactions
- [ ] Integration with update handlers
- [ ] Basic keyboard navigation
- [ ] Loading states

### Week 3: Performance
- [ ] Virtual scrolling implementation
- [ ] Memoization optimization
- [ ] Code splitting
- [ ] Performance monitoring
- [ ] Load testing

### Week 4: Polish
- [ ] Sorting implementation
- [ ] Grouping (stretch goal)
- [ ] Animations and transitions
- [ ] Accessibility audit
- [ ] Final testing

### Post-MVP Enhancements
- [ ] Bulk selection and actions
- [ ] Column customization
- [ ] Advanced filtering
- [ ] Export functionality
- [ ] Density options

## Conclusion

This architecture provides a solid foundation for the List View feature while maintaining the simplicity and performance characteristics of the existing application. By reusing the queue architecture and focusing on progressive enhancement, we can deliver a powerful new feature without disrupting the current user experience.

The phased implementation approach allows for continuous validation and adjustment based on user feedback, while the performance-first design ensures the application remains responsive even with large datasets.