# List View Feature - Technical Specification

## Overview

This document provides technical implementation details for the List View feature, which allows users to see all tasks in their current queue in a condensed, scannable format as an alternative to the single-task Processing View.

## Architecture

### Component Hierarchy

```
TaskProcessor (modified)
├── ViewModeToggle (new)
├── ProcessingView (existing, wrapped)
│   ├── TaskCard
│   ├── ProgressIndicator
│   └── TaskForm
└── ListView (new)
    ├── ListHeader (new)
    ├── ListBody (new)
    │   ├── GroupSection (new)
    │   └── TaskListItem (new)
    └── ListFooter (new)
```

### State Management

```typescript
// ViewMode type
type ViewMode = 'processing' | 'list';

// Additional state in TaskProcessor
const [viewMode, setViewMode] = useState<ViewMode>('processing');
const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
const [listSortBy, setListSortBy] = useState<SortOption>('default');
const [listGroupBy, setListGroupBy] = useState<GroupOption>('none');

// Sort and Group options
type SortOption = 'default' | 'priority' | 'dueDate' | 'createdAt' | 'alphabetical';
type GroupOption = 'none' | 'project' | 'priority' | 'dueDate' | 'label';
```

## Component Specifications

### 1. ViewModeToggle Component

```typescript
interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  taskCount: number;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onModeChange, taskCount }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onModeChange('processing')}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
          mode === 'processing' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-2">
          <ProcessingIcon className="w-4 h-4" />
          Processing
        </span>
      </button>
      <button
        onClick={() => onModeChange('list')}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
          mode === 'list' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <span className="flex items-center gap-2">
          <ListIcon className="w-4 h-4" />
          List
          {taskCount > 0 && (
            <span className="text-xs text-gray-500">({taskCount})</span>
          )}
        </span>
      </button>
    </div>
  );
};
```

### 2. ListView Component

```typescript
interface ListViewProps {
  tasks: TodoistTask[];
  projects: TodoistProject[];
  labels: TodoistLabel[];
  processingMode: ProcessingMode;
  onTaskComplete: (taskId: string) => void;
  onTaskProcess: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => void;
  onNavigateQueue: (direction: 'prev' | 'next') => void;
  collaborators: Record<string, TodoistUser[]>;
  projectMetadata: Record<string, any>;
}

const ListView: React.FC<ListViewProps> = ({
  tasks,
  projects,
  labels,
  processingMode,
  onTaskComplete,
  onTaskProcess,
  onTaskUpdate,
  onNavigateQueue,
  collaborators,
  projectMetadata
}) => {
  // Component implementation
};
```

### 3. TaskListItem Component

```typescript
interface TaskListItemProps {
  task: TodoistTask;
  project?: TodoistProject;
  labels: TodoistLabel[];
  isExpanded: boolean;
  isSelected: boolean;
  showProjectColumn: boolean;
  showPriorityColumn: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onComplete: () => void;
  onProcess: () => void;
  onUpdate: (updates: TaskUpdate) => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  project,
  labels,
  isExpanded,
  isSelected,
  showProjectColumn,
  showPriorityColumn,
  onToggleExpand,
  onToggleSelect,
  onComplete,
  onProcess,
  onUpdate
}) => {
  // Condensed row layout with hover actions
};
```

## Context-Aware Display Logic

```typescript
interface ColumnVisibility {
  project: boolean;
  priority: boolean;
  assignee: boolean;
  labels: boolean;
  dates: boolean;
}

function getColumnVisibility(mode: ProcessingMode): ColumnVisibility {
  switch (mode.type) {
    case 'project':
      // Hide project column when viewing single project
      return {
        project: Array.isArray(mode.value) && mode.value.length > 1,
        priority: true,
        assignee: true,
        labels: true,
        dates: true
      };
    
    case 'priority':
      // Hide priority column when filtering by priority
      return {
        project: true,
        priority: false,
        assignee: true,
        labels: true,
        dates: true
      };
    
    case 'label':
      // Always show labels but highlight filtered ones
      return {
        project: true,
        priority: true,
        assignee: true,
        labels: true,
        dates: true
      };
    
    default:
      // Show all columns for 'all', 'date', 'deadline', 'preset'
      return {
        project: true,
        priority: true,
        assignee: true,
        labels: true,
        dates: true
      };
  }
}
```

## Performance Optimizations

### Virtual Scrolling Implementation

```typescript
import { VariableSizeList as List } from 'react-window';

const VirtualizedTaskList: React.FC<VirtualizedListProps> = ({ tasks, ...props }) => {
  const getItemSize = (index: number) => {
    const task = tasks[index];
    const isExpanded = expandedTaskIds.has(task.id);
    return isExpanded ? EXPANDED_ROW_HEIGHT : COMPACT_ROW_HEIGHT;
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemCount={tasks.length}
          itemSize={getItemSize}
          overscanCount={5}
        >
          {({ index, style }) => (
            <div style={style}>
              <TaskListItem task={tasks[index]} {...props} />
            </div>
          )}
        </List>
      )}
    </AutoSizer>
  );
};
```

### Memoization Strategy

```typescript
// Memoized task list item
const MemoizedTaskListItem = React.memo(TaskListItem, (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.content === nextProps.task.content &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// Memoized sorting function
const sortedTasks = useMemo(() => {
  return sortTasks(tasks, listSortBy);
}, [tasks, listSortBy]);

// Memoized grouping function
const groupedTasks = useMemo(() => {
  return groupTasks(sortedTasks, listGroupBy);
}, [sortedTasks, listGroupBy]);
```

## Data Transformations

### Sorting Implementation

```typescript
function sortTasks(tasks: TodoistTask[], sortBy: SortOption): TodoistTask[] {
  const tasksCopy = [...tasks];
  
  switch (sortBy) {
    case 'priority':
      return tasksCopy.sort((a, b) => b.priority - a.priority);
    
    case 'dueDate':
      return tasksCopy.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due.date).getTime() - new Date(b.due.date).getTime();
      });
    
    case 'createdAt':
      return tasksCopy.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    
    case 'alphabetical':
      return tasksCopy.sort((a, b) => 
        a.content.toLowerCase().localeCompare(b.content.toLowerCase())
      );
    
    default:
      return tasksCopy; // Maintain original order
  }
}
```

### Grouping Implementation

```typescript
interface TaskGroup {
  id: string;
  title: string;
  tasks: TodoistTask[];
  metadata?: any;
}

function groupTasks(tasks: TodoistTask[], groupBy: GroupOption): TaskGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', title: 'All Tasks', tasks }];
  }
  
  const groups = new Map<string, TodoistTask[]>();
  
  tasks.forEach(task => {
    let groupKey: string;
    
    switch (groupBy) {
      case 'project':
        groupKey = task.projectId;
        break;
      
      case 'priority':
        groupKey = `priority-${task.priority}`;
        break;
      
      case 'dueDate':
        groupKey = task.due ? task.due.date : 'no-date';
        break;
      
      case 'label':
        // Tasks can belong to multiple label groups
        if (task.labels.length === 0) {
          groupKey = 'no-labels';
        } else {
          task.labels.forEach(label => {
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label)!.push(task);
          });
          return; // Skip the default group addition
        }
        break;
    }
    
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(task);
  });
  
  // Convert to array and add titles
  return Array.from(groups.entries()).map(([key, tasks]) => ({
    id: key,
    title: getGroupTitle(key, groupBy),
    tasks
  }));
}
```

## Keyboard Navigation

```typescript
const useKeyboardNavigation = (tasks: TodoistTask[], viewMode: ViewMode) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  useEffect(() => {
    if (viewMode !== 'list') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(0, prev - 1));
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(tasks.length - 1, prev + 1));
          break;
          
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            toggleTaskExpansion(tasks[focusedIndex].id);
          }
          break;
          
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) {
            switchToProcessingView(tasks[focusedIndex].id);
          }
          break;
          
        case 'c':
        case 'C':
          e.preventDefault();
          if (focusedIndex >= 0) {
            completeTask(tasks[focusedIndex].id);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, tasks, focusedIndex]);
  
  return { focusedIndex };
};
```

## API Integration

No new API endpoints required. The feature reuses existing data fetching mechanisms:

```typescript
// Existing data flow remains unchanged
const filteredTasks = filterTasksByMode(allTasksGlobal, processingMode, projectMetadata, assigneeFilter, currentUserId);

// List view receives the same filtered tasks
{viewMode === 'list' ? (
  <ListView
    tasks={activeQueue.map(id => masterTasks[id]).filter(Boolean)}
    projects={projects}
    labels={labels}
    processingMode={processingMode}
    // ... other props
  />
) : (
  // Existing processing view
)}
```

## CSS Architecture

```scss
// List view specific styles
.list-view {
  &-container {
    @apply flex flex-col h-full;
  }
  
  &-header {
    @apply sticky top-0 bg-white border-b border-gray-200 z-10;
  }
  
  &-body {
    @apply flex-1 overflow-auto;
  }
  
  &-task-row {
    @apply flex items-center px-4 py-2 border-b border-gray-100;
    @apply hover:bg-gray-50 transition-colors;
    
    &--expanded {
      @apply bg-blue-50 hover:bg-blue-100;
    }
    
    &--selected {
      @apply bg-blue-100;
    }
  }
  
  &-group-header {
    @apply sticky top-0 bg-gray-100 px-4 py-2 font-medium;
    @apply border-b border-gray-200;
  }
}

// Responsive breakpoints
@media (max-width: 768px) {
  .list-view-task-row {
    // Hide non-essential columns on mobile
    .column-assignee,
    .column-labels {
      @apply hidden;
    }
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('ListView', () => {
  it('renders all tasks in the current queue', () => {
    const tasks = generateMockTasks(10);
    const { getAllByTestId } = render(<ListView tasks={tasks} {...defaultProps} />);
    expect(getAllByTestId('task-list-item')).toHaveLength(10);
  });
  
  it('hides project column when viewing single project', () => {
    const props = {
      ...defaultProps,
      processingMode: { type: 'project', value: 'project-1', displayName: 'Project 1' }
    };
    const { queryByTestId } = render(<ListView {...props} />);
    expect(queryByTestId('column-header-project')).not.toBeInTheDocument();
  });
  
  it('expands task on click', () => {
    const { getByTestId } = render(<ListView {...defaultProps} />);
    const firstTask = getByTestId('task-list-item-0');
    fireEvent.click(firstTask);
    expect(firstTask).toHaveClass('list-view-task-row--expanded');
  });
});
```

### Integration Tests

```typescript
describe('View Mode Toggle', () => {
  it('switches between processing and list view', async () => {
    const { getByText, queryByTestId } = render(<TaskProcessor />);
    
    // Initially in processing view
    expect(queryByTestId('task-card')).toBeInTheDocument();
    expect(queryByTestId('list-view')).not.toBeInTheDocument();
    
    // Switch to list view
    fireEvent.click(getByText('List'));
    
    await waitFor(() => {
      expect(queryByTestId('task-card')).not.toBeInTheDocument();
      expect(queryByTestId('list-view')).toBeInTheDocument();
    });
  });
});
```

## Migration & Rollout

### Feature Flags

```typescript
const FEATURE_FLAGS = {
  LIST_VIEW_ENABLED: process.env.NEXT_PUBLIC_LIST_VIEW_ENABLED === 'true',
  LIST_VIEW_DEFAULT: process.env.NEXT_PUBLIC_LIST_VIEW_DEFAULT === 'true',
};

// Conditional rendering based on feature flag
{FEATURE_FLAGS.LIST_VIEW_ENABLED && (
  <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
)}
```

### Gradual Rollout Plan

1. **Phase 1**: Internal testing with feature flag
2. **Phase 2**: 10% of users with opt-in
3. **Phase 3**: 50% of users with opt-out
4. **Phase 4**: 100% rollout

### Analytics Events

```typescript
// Track view mode usage
const trackViewModeChange = (newMode: ViewMode) => {
  analytics.track('View Mode Changed', {
    from: viewMode,
    to: newMode,
    queueType: processingMode.type,
    taskCount: activeQueue.length
  });
};

// Track list view interactions
const trackListInteraction = (action: string, taskId: string) => {
  analytics.track('List View Interaction', {
    action,
    taskId,
    expandedCount: expandedTaskIds.size,
    sortBy: listSortBy,
    groupBy: listGroupBy
  });
};
```

## Performance Benchmarks

### Target Metrics

- Initial render: < 200ms for 500 tasks
- Scroll performance: 60fps minimum
- View toggle: < 100ms
- Sort/filter operations: < 300ms
- Memory usage: < 50MB increase

### Monitoring

```typescript
// Performance monitoring
const measureListViewPerformance = () => {
  performance.mark('list-view-start');
  
  // After render
  performance.mark('list-view-end');
  performance.measure('list-view-render', 'list-view-start', 'list-view-end');
  
  const measure = performance.getEntriesByName('list-view-render')[0];
  analytics.track('List View Performance', {
    renderTime: measure.duration,
    taskCount: tasks.length,
    viewportTasks: getVisibleTaskCount()
  });
};
```