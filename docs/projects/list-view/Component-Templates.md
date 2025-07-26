# List View Feature - Component Templates

## Ready-to-Use Component Files

### 1. View Mode Types
```typescript
// types/view-mode.ts
export type ViewMode = 'processing' | 'list';

export interface ListViewState {
  expandedTaskIds: Set<string>;
  selectedTaskIds: Set<string>;
  sortBy: SortOption;
  groupBy: GroupOption;
  focusedTaskId: string | null;
  scrollPosition: number;
}

export type SortOption = 'default' | 'priority' | 'dueDate' | 'createdAt' | 'alphabetical';
export type GroupOption = 'none' | 'project' | 'priority' | 'dueDate' | 'label';

export interface ColumnVisibility {
  project: boolean;
  priority: boolean;
  assignee: boolean;
  labels: boolean;
  dates: boolean;
  description: boolean;
}

export interface TaskGroup {
  id: string;
  title: string;
  tasks: any[];
  isCollapsed?: boolean;
  metadata?: any;
}
```

### 2. List View Utils
```typescript
// lib/list-view-utils.ts
import { TodoistTask } from '@/lib/types';
import { ProcessingMode } from '@/types/processing-mode';
import { ColumnVisibility, SortOption, GroupOption, TaskGroup } from '@/types/view-mode';

export function getColumnVisibility(mode: ProcessingMode): ColumnVisibility {
  const base: ColumnVisibility = {
    project: true,
    priority: true,
    assignee: true,
    labels: true,
    dates: true,
    description: false,
  };

  switch (mode.type) {
    case 'project':
      if (!Array.isArray(mode.value) || mode.value.length === 1) {
        base.project = false;
      }
      break;
    case 'priority':
      base.priority = false;
      break;
    case 'label':
      // Labels always visible but highlighted differently
      break;
    case 'date':
    case 'deadline':
      // Dates are crucial in time-based views
      break;
  }

  return base;
}

export function sortTasks(tasks: TodoistTask[], sortBy: SortOption): TodoistTask[] {
  const sorted = [...tasks];
  
  switch (sortBy) {
    case 'priority':
      return sorted.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority; // P1 (4) first
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        
        const dateA = new Date(a.due.date);
        const dateB = new Date(b.due.date);
        return dateA.getTime() - dateB.getTime();
      });
      
    case 'createdAt':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
    case 'alphabetical':
      return sorted.sort((a, b) => 
        a.content.toLowerCase().localeCompare(b.content.toLowerCase())
      );
      
    default:
      return sorted;
  }
}

export function groupTasks(
  tasks: TodoistTask[], 
  groupBy: GroupOption,
  projects: any[],
  projectMetadata: Record<string, any>
): TaskGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', title: '', tasks }];
  }
  
  const groups = new Map<string, TodoistTask[]>();
  
  tasks.forEach(task => {
    let groupKey: string;
    let groupTitle: string;
    
    switch (groupBy) {
      case 'project':
        groupKey = task.projectId;
        const project = projects.find(p => p.id === groupKey);
        groupTitle = project?.name || 'Unknown Project';
        break;
        
      case 'priority':
        groupKey = `priority-${task.priority}`;
        groupTitle = getPriorityLabel(task.priority);
        break;
        
      case 'dueDate':
        groupKey = task.due ? task.due.date : 'no-date';
        groupTitle = task.due ? formatGroupDate(task.due.date) : 'No Due Date';
        break;
        
      case 'label':
        if (task.labels.length === 0) {
          groupKey = 'no-labels';
          groupTitle = 'No Labels';
        } else {
          // Add to multiple groups for each label
          task.labels.forEach(label => {
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label)!.push(task);
          });
          return;
        }
        break;
        
      default:
        groupKey = 'all';
        groupTitle = 'All Tasks';
    }
    
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(task);
  });
  
  // Convert to array and sort groups
  const groupArray = Array.from(groups.entries()).map(([key, tasks]) => ({
    id: key,
    title: key.startsWith('priority-') ? getPriorityLabel(parseInt(key.split('-')[1])) : key,
    tasks,
  }));
  
  // Sort groups by priority if grouping by priority
  if (groupBy === 'priority') {
    groupArray.sort((a, b) => {
      const priorityA = parseInt(a.id.split('-')[1]);
      const priorityB = parseInt(b.id.split('-')[1]);
      return priorityB - priorityA; // P1 first
    });
  }
  
  return groupArray;
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 4: return 'Priority 1 (Urgent)';
    case 3: return 'Priority 2 (High)';
    case 2: return 'Priority 3 (Medium)';
    case 1: return 'Priority 4 (Low)';
    default: return 'No Priority';
  }
}

function formatGroupDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else if (date < today) {
    return 'Overdue';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
}
```

### 3. Simple ListView (No Virtual Scrolling)
```typescript
// components/ListView/SimpleListView.tsx
import React from 'react';
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types';
import { ProcessingMode } from '@/types/processing-mode';
import { ListViewState } from '@/types/view-mode';
import { getColumnVisibility, sortTasks, groupTasks } from '@/lib/list-view-utils';
import SimpleTaskRow from './SimpleTaskRow';

interface SimpleListViewProps {
  tasks: TodoistTask[];
  projects: TodoistProject[];
  labels: TodoistLabel[];
  processingMode: ProcessingMode;
  projectMetadata: Record<string, any>;
  listViewState: ListViewState;
  onListViewStateChange: (state: ListViewState) => void;
  onTaskUpdate: (taskId: string, updates: any) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskProcess: (taskId: string) => void;
  onViewModeChange: (mode: 'processing') => void;
}

export default function SimpleListView({
  tasks,
  projects,
  labels,
  processingMode,
  projectMetadata,
  listViewState,
  onListViewStateChange,
  onTaskUpdate,
  onTaskComplete,
  onTaskProcess,
  onViewModeChange,
}: SimpleListViewProps) {
  const columnVisibility = getColumnVisibility(processingMode);
  
  // Sort and group tasks
  const sortedTasks = sortTasks(tasks, listViewState.sortBy);
  const groupedTasks = groupTasks(sortedTasks, listViewState.groupBy, projects, projectMetadata);
  
  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - switch to processing view
      onViewModeChange('processing');
    } else {
      // Single click - select
      const isMulti = e.metaKey || e.ctrlKey;
      if (isMulti) {
        const newSelected = new Set(listViewState.selectedTaskIds);
        if (newSelected.has(taskId)) {
          newSelected.delete(taskId);
        } else {
          newSelected.add(taskId);
        }
        onListViewStateChange({
          ...listViewState,
          selectedTaskIds: newSelected,
          focusedTaskId: taskId,
        });
      } else {
        onListViewStateChange({
          ...listViewState,
          selectedTaskIds: new Set([taskId]),
          focusedTaskId: taskId,
        });
      }
    }
  };
  
  const handleToggleExpand = (taskId: string) => {
    const newExpanded = new Set(listViewState.expandedTaskIds);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    onListViewStateChange({
      ...listViewState,
      expandedTaskIds: newExpanded,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {processingMode.displayName} ({tasks.length} tasks)
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={listViewState.sortBy}
              onChange={(e) => onListViewStateChange({
                ...listViewState,
                sortBy: e.target.value as any,
              })}
              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="default">Default Order</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="createdAt">Newest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Task List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>No tasks to display</p>
          </div>
        ) : (
          groupedTasks.map(group => (
            <div key={group.id}>
              {group.title && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {group.title} ({group.tasks.length})
                </div>
              )}
              {group.tasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <SimpleTaskRow
                    key={task.id}
                    task={task}
                    project={project}
                    labels={labels}
                    columnVisibility={columnVisibility}
                    isExpanded={listViewState.expandedTaskIds.has(task.id)}
                    isSelected={listViewState.selectedTaskIds.has(task.id)}
                    isFocused={listViewState.focusedTaskId === task.id}
                    onClick={(e) => handleTaskClick(task.id, e)}
                    onToggleExpand={() => handleToggleExpand(task.id)}
                    onComplete={() => onTaskComplete(task.id)}
                    onProcess={() => onTaskProcess(task.id)}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      {listViewState.selectedTaskIds.size > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {listViewState.selectedTaskIds.size} selected
            </span>
            <button
              onClick={() => onListViewStateChange({
                ...listViewState,
                selectedTaskIds: new Set(),
              })}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Simple Task Row
```typescript
// components/ListView/SimpleTaskRow.tsx
import React, { useState } from 'react';
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types';
import { ColumnVisibility } from '@/types/view-mode';
import PriorityFlag from '@/components/PriorityFlag';
import LabelIcon from '@/components/LabelIcon';

interface SimpleTaskRowProps {
  task: TodoistTask;
  project?: TodoistProject;
  labels: TodoistLabel[];
  columnVisibility: ColumnVisibility;
  isExpanded: boolean;
  isSelected: boolean;
  isFocused: boolean;
  onClick: (e: React.MouseEvent) => void;
  onToggleExpand: () => void;
  onComplete: () => void;
  onProcess: () => void;
}

export default function SimpleTaskRow({
  task,
  project,
  labels,
  columnVisibility,
  isExpanded,
  isSelected,
  isFocused,
  onClick,
  onToggleExpand,
  onComplete,
  onProcess,
}: SimpleTaskRowProps) {
  const [showActions, setShowActions] = useState(false);
  const taskLabels = labels.filter(l => task.labels.includes(l.name));
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isOverdue = date < today;
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    if (isOverdue) return `Overdue (${date.toLocaleDateString()})`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`
        transition-colors cursor-pointer
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
        ${isFocused ? 'ring-2 ring-inset ring-blue-500' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Main Row */}
      <div className="flex items-center px-4 py-2 min-h-[48px]">
        {/* Complete Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="flex-shrink-0 w-5 h-5 mr-3 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          title="Complete task"
        />
        
        {/* Priority */}
        {columnVisibility.priority && (
          <div className="flex-shrink-0 mr-3">
            <PriorityFlag priority={task.priority} size="sm" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0 mr-3">
          <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
            {task.content}
          </div>
        </div>
        
        {/* Project */}
        {columnVisibility.project && project && (
          <div className="flex-shrink-0 mr-3">
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
              {project.name}
            </span>
          </div>
        )}
        
        {/* Labels */}
        {columnVisibility.labels && taskLabels.length > 0 && (
          <div className="flex-shrink-0 mr-3 flex gap-1">
            {taskLabels.slice(0, 2).map(label => (
              <LabelIcon key={label.id} label={label} size="sm" />
            ))}
            {taskLabels.length > 2 && (
              <span className="text-xs text-gray-500">+{taskLabels.length - 2}</span>
            )}
          </div>
        )}
        
        {/* Dates */}
        {columnVisibility.dates && (task.due || task.deadline) && (
          <div className="flex-shrink-0 mr-3 text-xs text-gray-600 dark:text-gray-400">
            {task.due && (
              <div className={new Date(task.due.date) < new Date() ? 'text-red-600' : ''}>
                📅 {formatDate(task.due.date)}
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className={`flex-shrink-0 flex gap-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Expand"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Process"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" 
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          {task.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {task.description}
            </div>
          )}
          <div className="flex gap-2">
            <button className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50">
              Edit
            </button>
            <button className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50">
              Move
            </button>
            <button className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50">
              Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. Integration in TaskProcessor
```typescript
// Add to TaskProcessor.tsx imports
import { ViewMode, ListViewState } from '@/types/view-mode';
import ViewModeToggle from '@/components/ViewModeToggle';
import SimpleListView from '@/components/ListView/SimpleListView';

// Add state (inside TaskProcessor component)
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('taskProcessor.viewMode') as ViewMode) || 'processing';
  }
  return 'processing';
});

const [listViewState, setListViewState] = useState<ListViewState>({
  expandedTaskIds: new Set(),
  selectedTaskIds: new Set(),
  sortBy: 'default',
  groupBy: 'none',
  focusedTaskId: null,
  scrollPosition: 0,
});

// Persist view mode
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('taskProcessor.viewMode', viewMode);
  }
}, [viewMode]);

// Handle view mode change
const handleViewModeChange = useCallback((newMode: ViewMode) => {
  setViewMode(newMode);
  
  // If switching to list view with a current task, focus it
  if (newMode === 'list' && currentTask) {
    setListViewState(prev => ({
      ...prev,
      focusedTaskId: currentTask.id,
      expandedTaskIds: new Set([currentTask.id]),
    }));
  }
}, [currentTask]);

// Add ViewModeToggle to header (after AssigneeFilter)
<ViewModeToggle
  mode={viewMode}
  onModeChange={handleViewModeChange}
  taskCount={activeQueue.length}
  isLoading={loadingTasks}
/>

// Replace main content area with conditional rendering
{viewMode === 'processing' ? (
  // Existing processing view content
  <div className="space-y-6">
    {/* ... existing TaskCard, TaskForm, etc. ... */}
  </div>
) : (
  // New list view
  <SimpleListView
    tasks={activeQueue.map(id => masterTasks[id]).filter(Boolean)}
    projects={projects}
    labels={labels}
    processingMode={processingMode}
    projectMetadata={projectMetadata}
    listViewState={listViewState}
    onListViewStateChange={setListViewState}
    onTaskUpdate={handleTaskUpdate}
    onTaskComplete={handleCompleteTask}
    onTaskProcess={handleProcessTask}
    onViewModeChange={handleViewModeChange}
  />
)}

// Add keyboard shortcut for view toggle
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Existing shortcuts...
    
    // Add view toggle shortcuts
    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      setViewMode(prev => prev === 'processing' ? 'list' : 'processing');
    }
    
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      setViewMode('list');
    }
    
    if (e.key === 'p' || e.key === 'P') {
      if (!e.metaKey && !e.ctrlKey) { // Don't interfere with priority shortcut
        e.preventDefault();
        setViewMode('processing');
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* ... existing deps ... */]);
```

## Quick Implementation Steps

1. **Create the type definitions** in `types/view-mode.ts`
2. **Add utilities** in `lib/list-view-utils.ts`
3. **Create ViewModeToggle** component
4. **Create SimpleListView** and **SimpleTaskRow** components
5. **Update TaskProcessor** with the integration code
6. **Test basic functionality**
7. **Add virtual scrolling later** when performance requires it

This gives you a working List View that you can ship quickly and iterate on!