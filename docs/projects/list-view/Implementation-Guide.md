# List View Feature - Implementation Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Component Implementation](#component-implementation)
3. [State Management Implementation](#state-management-implementation)
4. [Performance Implementation](#performance-implementation)
5. [Context-Aware Display Logic](#context-aware-display-logic)
6. [Keyboard Navigation Implementation](#keyboard-navigation-implementation)
7. [Testing Implementation](#testing-implementation)
8. [Migration Checklist](#migration-checklist)

## Quick Start

### Step 1: Add Types
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
```

### Step 2: Update TaskProcessor State
```typescript
// In TaskProcessor.tsx
import { ViewMode, ListViewState } from '@/types/view-mode';

// Add new state
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
  localStorage.setItem('taskProcessor.viewMode', viewMode);
}, [viewMode]);
```

## Component Implementation

### ViewModeToggle Component
```typescript
// components/ViewModeToggle.tsx
import React from 'react';
import { ViewMode } from '@/types/view-mode';

interface ViewModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  taskCount: number;
  isLoading?: boolean;
}

export default function ViewModeToggle({ 
  mode, 
  onModeChange, 
  taskCount, 
  isLoading 
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <button
        onClick={() => onModeChange('processing')}
        disabled={isLoading}
        className={`
          px-3 py-1.5 text-sm font-medium rounded transition-all
          flex items-center gap-2
          ${mode === 'processing' 
            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Processing View (P)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
          />
        </svg>
        <span className="hidden sm:inline">Processing</span>
      </button>
      
      <button
        onClick={() => onModeChange('list')}
        disabled={isLoading}
        className={`
          px-3 py-1.5 text-sm font-medium rounded transition-all
          flex items-center gap-2
          ${mode === 'list' 
            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="List View (L)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
        <span className="hidden sm:inline">List</span>
        {taskCount > 0 && mode === 'list' && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({taskCount})
          </span>
        )}
      </button>
    </div>
  );
}
```

### ListView Container Component
```typescript
// components/ListView/ListView.tsx
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types';
import { ProcessingMode } from '@/types/processing-mode';
import { ListViewState, SortOption, GroupOption } from '@/types/view-mode';
import ListHeader from './ListHeader';
import TaskListItem from './TaskListItem';
import { getColumnVisibility } from '@/lib/list-view-utils';
import { sortTasks, groupTasks } from '@/lib/task-transformations';

interface ListViewProps {
  tasks: TodoistTask[];
  masterTasks: Record<string, TodoistTask>;
  activeQueue: string[];
  projects: TodoistProject[];
  labels: TodoistLabel[];
  processingMode: ProcessingMode;
  projectMetadata: Record<string, any>;
  collaborators: any;
  listViewState: ListViewState;
  onListViewStateChange: (state: ListViewState) => void;
  onTaskUpdate: (taskId: string, updates: any) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskProcess: (taskId: string) => void;
  onViewModeChange: (mode: 'processing') => void;
  onNavigateQueue: (direction: 'prev' | 'next') => void;
}

const COMPACT_ROW_HEIGHT = 48;
const EXPANDED_ROW_HEIGHT = 150;

export default function ListView({
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
  onNavigateQueue,
}: ListViewProps) {
  const listRef = useRef<List>(null);
  
  // Compute column visibility based on processing mode
  const columnVisibility = useMemo(
    () => getColumnVisibility(processingMode),
    [processingMode]
  );

  // Process tasks (sort and group)
  const processedTasks = useMemo(() => {
    let result = sortTasks([...tasks], listViewState.sortBy);
    
    if (listViewState.groupBy !== 'none') {
      return groupTasks(result, listViewState.groupBy, projects, projectMetadata);
    }
    
    return [{ id: 'all', title: '', tasks: result, isCollapsed: false }];
  }, [tasks, listViewState.sortBy, listViewState.groupBy, projects, projectMetadata]);

  // Flatten tasks for virtual list
  const flatItems = useMemo(() => {
    const items: any[] = [];
    
    processedTasks.forEach(group => {
      if (group.title) {
        items.push({ type: 'group-header', ...group });
      }
      if (!group.isCollapsed) {
        group.tasks.forEach(task => {
          items.push({ type: 'task', data: task });
        });
      }
    });
    
    return items;
  }, [processedTasks]);

  // Calculate item size
  const getItemSize = useCallback((index: number) => {
    const item = flatItems[index];
    if (item.type === 'group-header') {
      return 40; // Group header height
    }
    
    const taskId = item.data.id;
    if (listViewState.expandedTaskIds.has(taskId)) {
      return EXPANDED_ROW_HEIGHT;
    }
    return COMPACT_ROW_HEIGHT;
  }, [flatItems, listViewState.expandedTaskIds]);

  // Reset virtual list cache when expanded state changes
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [listViewState.expandedTaskIds]);

  // Task interaction handlers
  const handleToggleExpand = useCallback((taskId: string) => {
    onListViewStateChange({
      ...listViewState,
      expandedTaskIds: new Set(
        listViewState.expandedTaskIds.has(taskId)
          ? [...listViewState.expandedTaskIds].filter(id => id !== taskId)
          : [...listViewState.expandedTaskIds, taskId]
      ),
      focusedTaskId: taskId,
    });
  }, [listViewState, onListViewStateChange]);

  const handleToggleSelect = useCallback((taskId: string, isMulti: boolean) => {
    if (!isMulti) {
      // Single selection
      onListViewStateChange({
        ...listViewState,
        selectedTaskIds: new Set([taskId]),
        focusedTaskId: taskId,
      });
    } else {
      // Multi selection
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
    }
  }, [listViewState, onListViewStateChange]);

  const handleDoubleClick = useCallback((taskId: string) => {
    // Switch to processing view with this task
    onListViewStateChange({
      ...listViewState,
      focusedTaskId: taskId,
    });
    onViewModeChange('processing');
  }, [listViewState, onListViewStateChange, onViewModeChange]);

  // Row renderer
  const Row = useCallback(({ index, style }: any) => {
    const item = flatItems[index];
    
    if (item.type === 'group-header') {
      return (
        <div style={style} className="sticky top-0 z-10">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            {item.title} ({item.tasks.length})
          </div>
        </div>
      );
    }
    
    const task = item.data;
    const project = projects.find(p => p.id === task.projectId);
    
    return (
      <div style={style}>
        <TaskListItem
          key={task.id}
          taskId={task.id}
          task={task}
          project={project}
          labels={labels}
          visibleColumns={columnVisibility}
          isExpanded={listViewState.expandedTaskIds.has(task.id)}
          isSelected={listViewState.selectedTaskIds.has(task.id)}
          isFocused={listViewState.focusedTaskId === task.id}
          onToggleExpand={() => handleToggleExpand(task.id)}
          onToggleSelect={(isMulti) => handleToggleSelect(task.id, isMulti)}
          onComplete={() => onTaskComplete(task.id)}
          onProcess={() => onTaskProcess(task.id)}
          onUpdate={(updates) => onTaskUpdate(task.id, updates)}
          onDoubleClick={() => handleDoubleClick(task.id)}
        />
      </div>
    );
  }, [flatItems, projects, labels, columnVisibility, listViewState, handleToggleExpand, handleToggleSelect, onTaskComplete, onTaskProcess, onTaskUpdate, handleDoubleClick]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <ListHeader
        processingMode={processingMode}
        taskCount={tasks.length}
        selectedCount={listViewState.selectedTaskIds.size}
        sortBy={listViewState.sortBy}
        groupBy={listViewState.groupBy}
        onSortChange={(sortBy) => onListViewStateChange({ ...listViewState, sortBy })}
        onGroupChange={(groupBy) => onListViewStateChange({ ...listViewState, groupBy })}
      />
      
      <div className="flex-1 min-h-0">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">No tasks in this view</p>
            </div>
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                height={height}
                width={width}
                itemCount={flatItems.length}
                itemSize={getItemSize}
                overscanCount={5}
                initialScrollOffset={listViewState.scrollPosition}
                onScroll={({ scrollOffset }) => {
                  onListViewStateChange({
                    ...listViewState,
                    scrollPosition: scrollOffset,
                  });
                }}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </div>
      
      {/* Footer with bulk actions (future) */}
      {listViewState.selectedTaskIds.size > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {listViewState.selectedTaskIds.size} selected
            </span>
            <button
              onClick={() => onListViewStateChange({
                ...listViewState,
                selectedTaskIds: new Set(),
              })}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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

### TaskListItem Component
```typescript
// components/ListView/TaskListItem.tsx
import React, { memo, useCallback, useState } from 'react';
import { TodoistTask, TodoistProject, TodoistLabel } from '@/lib/types';
import { ColumnVisibility } from '@/types/view-mode';
import PriorityFlag from '@/components/PriorityFlag';
import LabelIcon from '@/components/LabelIcon';
import { formatTaskDate } from '@/lib/date-utils';

interface TaskListItemProps {
  taskId: string;
  task: TodoistTask;
  project?: TodoistProject;
  labels: TodoistLabel[];
  visibleColumns: ColumnVisibility;
  isExpanded: boolean;
  isSelected: boolean;
  isFocused: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (isMulti: boolean) => void;
  onComplete: () => void;
  onProcess: () => void;
  onUpdate: (updates: any) => void;
  onDoubleClick: () => void;
}

const TaskListItem = memo(function TaskListItem({
  task,
  project,
  labels,
  visibleColumns,
  isExpanded,
  isSelected,
  isFocused,
  onToggleExpand,
  onToggleSelect,
  onComplete,
  onProcess,
  onUpdate,
  onDoubleClick,
}: TaskListItemProps) {
  const [showActions, setShowActions] = useState(false);
  
  const taskLabels = labels.filter(l => task.labels.includes(l.name));
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.detail === 2) {
      onDoubleClick();
    } else {
      onToggleSelect(e.metaKey || e.ctrlKey);
    }
  }, [onDoubleClick, onToggleSelect]);

  return (
    <div
      className={`
        border-b border-gray-100 dark:border-gray-800 transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
        ${isFocused ? 'ring-2 ring-inset ring-blue-500' : ''}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
    >
      {/* Compact View */}
      <div className="flex items-center px-4 py-2 min-h-[48px]">
        {/* Checkbox */}
        <div className="flex-shrink-0 mr-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            title="Complete task (C)"
          />
        </div>

        {/* Priority */}
        {visibleColumns.priority && (
          <div className="flex-shrink-0 mr-3">
            <PriorityFlag priority={task.priority} size="sm" />
          </div>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${task.priority === 4 ? 'font-medium' : ''}`}>
            <span className="truncate block">{task.content}</span>
          </div>
          {isExpanded && task.description && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {task.description}
            </div>
          )}
        </div>

        {/* Project */}
        {visibleColumns.project && project && (
          <div className="flex-shrink-0 mx-2">
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
              {project.name}
            </span>
          </div>
        )}

        {/* Labels */}
        {visibleColumns.labels && taskLabels.length > 0 && (
          <div className="flex-shrink-0 mx-2 flex gap-1">
            {taskLabels.slice(0, isExpanded ? undefined : 2).map(label => (
              <LabelIcon key={label.id} label={label} size="sm" />
            ))}
            {!isExpanded && taskLabels.length > 2 && (
              <span className="text-xs text-gray-500">+{taskLabels.length - 2}</span>
            )}
          </div>
        )}

        {/* Dates */}
        {visibleColumns.dates && (
          <div className="flex-shrink-0 mx-2 flex gap-2 text-xs">
            {task.due && (
              <span className={`flex items-center gap-1 ${
                new Date(task.due.date) < new Date() ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatTaskDate(task.due.date)}
              </span>
            )}
            {task.deadline && (
              <span className={`flex items-center gap-1 ${
                new Date(task.deadline.date) < new Date() ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTaskDate(task.deadline.date)}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={`flex-shrink-0 ml-2 flex gap-1 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Expand/Collapse (Space)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} 
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Process task (E)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          {/* Quick actions would go here */}
          <div className="flex gap-2">
            <button className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600">
              Edit
            </button>
            <button className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600">
              Move
            </button>
            <button className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600">
              Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default TaskListItem;
```

## Context-Aware Display Logic

```typescript
// lib/list-view-utils.ts
import { ProcessingMode } from '@/types/processing-mode';
import { ColumnVisibility } from '@/types/view-mode';

export function getColumnVisibility(mode: ProcessingMode): ColumnVisibility {
  const base: ColumnVisibility = {
    project: true,
    priority: true,
    assignee: true,
    labels: true,
    dates: true,
    description: false, // Only in expanded view
  };

  switch (mode.type) {
    case 'project':
      // Hide project column when viewing single project
      if (!Array.isArray(mode.value) || mode.value.length === 1) {
        base.project = false;
      }
      break;
      
    case 'priority':
      // Hide priority column when filtering by single priority
      base.priority = false;
      break;
      
    case 'label':
      // Keep labels visible but highlight filtered ones differently
      break;
      
    case 'date':
    case 'deadline':
      // Dates are always important in date-based views
      break;
      
    case 'all':
      // Show everything in all tasks view
      break;
  }

  return base;
}
```

## Keyboard Navigation Implementation

```typescript
// hooks/useListViewKeyboard.ts
import { useEffect, useCallback } from 'react';
import { ListViewState } from '@/types/view-mode';

export function useListViewKeyboard({
  tasks,
  listViewState,
  onListViewStateChange,
  onTaskComplete,
  onTaskProcess,
  onViewModeChange,
}: any) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const { focusedTaskId } = listViewState;
    const taskIndex = tasks.findIndex((t: any) => t.id === focusedTaskId);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (taskIndex > 0) {
          onListViewStateChange({
            ...listViewState,
            focusedTaskId: tasks[taskIndex - 1].id,
          });
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (taskIndex < tasks.length - 1) {
          onListViewStateChange({
            ...listViewState,
            focusedTaskId: tasks[taskIndex + 1].id,
          });
        }
        break;

      case ' ':
        e.preventDefault();
        if (focusedTaskId) {
          const expanded = new Set(listViewState.expandedTaskIds);
          if (expanded.has(focusedTaskId)) {
            expanded.delete(focusedTaskId);
          } else {
            expanded.add(focusedTaskId);
          }
          onListViewStateChange({
            ...listViewState,
            expandedTaskIds: expanded,
          });
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedTaskId) {
          onViewModeChange('processing');
        }
        break;

      case 'c':
      case 'C':
        e.preventDefault();
        if (focusedTaskId) {
          onTaskComplete(focusedTaskId);
        }
        break;

      case 'e':
      case 'E':
        e.preventDefault();
        if (focusedTaskId) {
          onTaskProcess(focusedTaskId);
        }
        break;

      case 'a':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          // Select all
          onListViewStateChange({
            ...listViewState,
            selectedTaskIds: new Set(tasks.map((t: any) => t.id)),
          });
        }
        break;

      case 'Escape':
        // Clear selection
        onListViewStateChange({
          ...listViewState,
          selectedTaskIds: new Set(),
        });
        break;
    }
  }, [tasks, listViewState, onListViewStateChange, onTaskComplete, onTaskProcess, onViewModeChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

## Testing Implementation

```typescript
// __tests__/ListView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ListView from '@/components/ListView/ListView';
import { generateMockTasks } from '@/test-utils/mock-data';

describe('ListView Component', () => {
  const defaultProps = {
    tasks: generateMockTasks(10),
    masterTasks: {},
    activeQueue: [],
    projects: [],
    labels: [],
    processingMode: { type: 'all', value: 'oldest', displayName: 'All Tasks' },
    projectMetadata: {},
    collaborators: {},
    listViewState: {
      expandedTaskIds: new Set(),
      selectedTaskIds: new Set(),
      sortBy: 'default',
      groupBy: 'none',
      focusedTaskId: null,
      scrollPosition: 0,
    },
    onListViewStateChange: jest.fn(),
    onTaskUpdate: jest.fn(),
    onTaskComplete: jest.fn(),
    onTaskProcess: jest.fn(),
    onViewModeChange: jest.fn(),
    onNavigateQueue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all tasks', () => {
    render(<ListView {...defaultProps} />);
    expect(screen.getAllByTestId(/task-list-item/)).toHaveLength(10);
  });

  test('expands task on click', () => {
    const { rerender } = render(<ListView {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('expand-task-1'));
    
    expect(defaultProps.onListViewStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        expandedTaskIds: new Set(['task-1']),
      })
    );
  });

  test('selects task on click', () => {
    render(<ListView {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('task-list-item-1'));
    
    expect(defaultProps.onListViewStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedTaskIds: new Set(['task-1']),
        focusedTaskId: 'task-1',
      })
    );
  });

  test('completes task on checkbox click', () => {
    render(<ListView {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('complete-task-1'));
    
    expect(defaultProps.onTaskComplete).toHaveBeenCalledWith('task-1');
  });

  test('switches to processing view on double click', () => {
    render(<ListView {...defaultProps} />);
    
    fireEvent.doubleClick(screen.getByTestId('task-list-item-1'));
    
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('processing');
  });

  test('hides columns based on processing mode', () => {
    const props = {
      ...defaultProps,
      processingMode: { type: 'project', value: 'p1', displayName: 'Project 1' },
    };
    
    render(<ListView {...props} />);
    
    expect(screen.queryByTestId('project-column')).not.toBeInTheDocument();
  });

  test('sorts tasks when sort option changes', () => {
    render(<ListView {...defaultProps} />);
    
    fireEvent.change(screen.getByTestId('sort-select'), {
      target: { value: 'priority' },
    });
    
    expect(defaultProps.onListViewStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'priority',
      })
    );
  });
});
```

## Migration Checklist

### Phase 1: Foundation Setup
- [ ] Create `types/view-mode.ts` with all required types
- [ ] Add ViewMode state to TaskProcessor
- [ ] Create ViewModeToggle component
- [ ] Add conditional rendering in TaskProcessor
- [ ] Set up localStorage persistence
- [ ] Add view toggle to header UI

### Phase 2: Basic List View
- [ ] Create ListView directory structure
- [ ] Implement basic ListView container
- [ ] Create TaskListItem component
- [ ] Add column visibility logic
- [ ] Implement expand/collapse functionality
- [ ] Connect to existing task update handlers

### Phase 3: Interactions
- [ ] Add click handlers for selection
- [ ] Implement double-click to process
- [ ] Add hover states and actions
- [ ] Connect complete/process actions
- [ ] Add keyboard navigation hook
- [ ] Test all interactions

### Phase 4: Performance
- [ ] Add react-window dependency
- [ ] Implement virtual scrolling
- [ ] Add memoization to components
- [ ] Implement lazy loading
- [ ] Add performance monitoring
- [ ] Test with 500+ tasks

### Phase 5: Polish
- [ ] Implement sorting functionality
- [ ] Add grouping (if time permits)
- [ ] Add smooth transitions
- [ ] Mobile responsive design
- [ ] Accessibility audit
- [ ] Cross-browser testing

### Phase 6: Integration
- [ ] Test with all processing modes
- [ ] Verify queue navigation
- [ ] Test overlay interactions
- [ ] Ensure state persistence
- [ ] Add analytics tracking
- [ ] Documentation update

## Next Steps

1. Start with Phase 1 implementation
2. Get early feedback on ViewModeToggle UX
3. Build ListView incrementally
4. Test performance early with large datasets
5. Iterate based on user feedback

Remember: Keep it simple, make it fast, ship it incrementally!