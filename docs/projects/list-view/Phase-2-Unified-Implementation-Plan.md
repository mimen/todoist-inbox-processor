# Phase 2: Unified List View Implementation Plan

## Overview

This document outlines the implementation plan for Phase 2 of the List View feature, incorporating the unified architecture solution (Option 1) from the multi-list architecture analysis. The plan consolidates single and multi-list views into one component, eliminating the current architectural issues.

## Current Status Summary

### Completed (Phase 1) ✅
- Single list view with full functionality
- Keyboard navigation (arrows, j/k, all shortcuts)
- All overlays integrated
- Inline editing with loading states
- Multi-select functionality
- Quick actions on hover
- Sorting functionality

### In Progress (Phase 2) 🚧
- Multi-list container (buggy, needs replacement)
- Settings modal and context
- Duplicate filtering option
- Load more button

### Architecture Issues Identified
1. Dual component conflict (ListView vs MultiListContainer)
2. Focus management race conditions
3. Event handling conflicts
4. State synchronization bugs
5. Keyboard navigation only works on first list

## Unified Architecture Solution

### Core Principle
Transform ListView into a unified component that handles both single and multi-list modes internally, eliminating all synchronization issues.

### New Component Structure
```typescript
// Unified ListView Component
interface UnifiedListViewProps {
  // Data
  allTasks: TodoistTask[]
  projects: TodoistProject[]
  labels: TodoistLabel[]
  
  // Mode Configuration
  viewMode: 'single' | 'multi'
  processingMode: ProcessingMode
  
  // Multi-list Configuration (when viewMode === 'multi')
  prioritizedSequence?: QueueOption[]
  visibleListCount?: number
  
  // Settings
  settings: ListViewSettings
  
  // State & Handlers
  listViewState: ListViewState
  onListViewStateChange: (state: ListViewState) => void
  onTaskUpdate: (taskId: string, updates: TaskUpdate) => Promise<void>
  // ... other handlers
}
```

## Implementation Phases

### Phase 2.1: Unified Component Foundation (Week 1)

#### LV2-UNIFIED-001: Create Unified ListView Component
**Priority**: Critical  
**Status**: Not Started  
**Description**: Merge ListView and MultiListContainer into single component
- Create new `UnifiedListView.tsx` component
- Support both single and multi modes via props
- Single source of truth for keyboard navigation
- Single focus management system
- Unified state management

#### LV2-UNIFIED-002: Migrate Single List Logic
**Priority**: Critical  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-001  
**Description**: Port all single list functionality to unified component
- Move existing ListView logic
- Ensure backward compatibility
- Maintain all existing features
- Add mode detection logic

#### LV2-UNIFIED-003: Implement Multi-List Rendering
**Priority**: Critical  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-002  
**Description**: Add multi-list rendering capabilities
- Render multiple list sections
- Implement load more button
- Handle list-specific processing modes
- Maintain single keyboard navigation across all lists

#### LV2-UNIFIED-004: Unify Keyboard Navigation
**Priority**: Critical  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-003  
**Description**: Single keyboard handler for all lists
- Global task navigation across lists
- Seamless arrow key movement
- All shortcuts work on any task
- Proper scroll-into-view behavior

### Phase 2.2: Settings System (Week 2)

#### LV2-005: Settings Data Model & localStorage ✅
**Status**: Completed  
**Description**: Basic settings infrastructure exists

#### LV2-006: Build Settings UI Component (Gear Icon + Modal) ✅
**Status**: Completed  
**Description**: Settings modal with gear icon implemented

#### LV2-007: Implement Multi-List Mode Toggle ✅
**Status**: Completed  
**Description**: Toggle between single/multi list modes

#### LV2-008: Implement Duplicate Task Filtering ✅
**Status**: Completed  
**Description**: Filter to show tasks only in first matching list

#### LV2-UNIFIED-005: Add Collapsible Lists Setting
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-003  
**Description**: Allow lists to be collapsed/expanded
- Add collapsed state to settings
- Implement collapse/expand UI
- Persist collapsed state
- Keyboard shortcut for toggle

### Phase 2.3: Enhanced List Features (Week 3)

#### LV2-009: Create Collapsible Lists Functionality
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-005  
**Description**: UI for collapsing/expanding lists
- Collapse/expand icons in headers
- Smooth animations
- Remember state per list
- Collapse all/expand all options

#### LV2-010: Add Enhanced List Headers
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-003  
**Description**: Rich list headers with metadata
- Project color indicators
- Priority flags for priority lists
- Label colors
- Task count and stats
- Icons from queue configuration

#### LV2-011: Implement List Separator Spacing
**Priority**: Low  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-003  
**Description**: Visual separation between lists
- Configurable spacing
- Visual dividers
- Consistent with design system

### Phase 2.4: Bulk Operations (Week 4)

#### LV2-012: Create Bulk Actions Bar Component
**Priority**: High  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-004  
**Description**: Floating bar when tasks selected
- Shows when 2+ tasks selected
- Common actions (complete, delete, etc.)
- Smooth animation
- Mobile responsive

#### LV2-013: Implement Bulk Complete with Confirmation
**Priority**: High  
**Status**: Not Started  
**Dependencies**: LV2-012  
**Description**: Bulk complete selected tasks
- Confirmation for 5+ tasks
- Show task count in confirmation
- Undo capability
- Success feedback

#### LV2-014: Implement Bulk Delete with Confirmation
**Priority**: High  
**Status**: Not Started  
**Dependencies**: LV2-012  
**Description**: Bulk delete selected tasks
- Always require confirmation
- Show task titles in confirmation
- No undo (Todoist limitation)
- Clear selection after

#### LV2-015: Implement Bulk Project Assignment
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-012  
**Description**: Move multiple tasks to project
- Use existing project overlay
- Apply to all selected tasks
- Show progress indicator
- Handle errors gracefully

#### LV2-016: Implement Bulk Priority Setting
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-012  
**Description**: Set priority for multiple tasks
- Use existing priority overlay
- Apply to all selected tasks
- Visual feedback during update

#### LV2-017: Implement Bulk Label Operations
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-012  
**Description**: Add/remove labels in bulk
- Use existing label overlay
- Support both add and remove
- Show current common labels

#### LV2-018: Create Multi-Task Scheduling Queue
**Priority**: Medium  
**Status**: Not Started  
**Dependencies**: LV2-012  
**Description**: Schedule multiple tasks sequentially
- Enter scheduling mode
- Show task 1 of N
- Use existing scheduler
- Auto-advance to next
- Skip/cancel options

### Phase 2.5: Context Menu & Polish (Week 5)

#### LV2-019: Create Right-Click Context Menu
**Priority**: Low  
**Status**: Not Started  
**Dependencies**: LV2-UNIFIED-004  
**Description**: Context menu for quick actions
- Right-click on any task
- Common actions
- Keyboard accessible
- Works with selection

#### LV2-020: Add Touch/Long-Press Support
**Priority**: Low  
**Status**: Not Started  
**Dependencies**: LV2-019  
**Description**: Mobile context menu support
- Long press detection
- Touch-friendly menu
- Haptic feedback where supported

## Migration Strategy

### Step 1: Create Unified Component (Non-Breaking)
1. Create new `UnifiedListView` component
2. Keep existing `ListView` and `MultiListContainer` temporarily
3. Implement all functionality in unified component
4. Test thoroughly

### Step 2: Gradual Migration
1. Update `TaskProcessor` to use `UnifiedListView` for multi-list mode
2. Test multi-list functionality
3. Update `TaskProcessor` to use `UnifiedListView` for single-list mode
4. Test single-list functionality

### Step 3: Cleanup
1. Remove old `MultiListContainer` component
2. Remove old `ListView` component
3. Rename `UnifiedListView` to `ListView`
4. Update all imports

## Technical Considerations

### State Management
```typescript
interface UnifiedListViewState {
  // Global state
  highlightedTaskId: string | null
  selectedTaskIds: Set<string>
  editingTaskId: string | null
  
  // Per-list state (keyed by list ID)
  listStates: Map<string, {
    sortBy: SortOption
    isCollapsed: boolean
    scrollPosition: number
  }>
  
  // Multi-list specific
  visibleListCount: number
  loadedLists: Set<string>
}
```

### Performance Optimizations
1. **Memoization**: Heavy use of useMemo for task filtering
2. **Lazy Loading**: Load lists only when needed
3. **Virtualization**: Consider react-window for very long lists
4. **Debouncing**: Debounce keyboard navigation updates

### Keyboard Navigation
```typescript
// Single keyboard handler at the unified component level
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // Navigation works across all lists
  const allVisibleTasks = getAllVisibleTasks()
  const currentIndex = allVisibleTasks.findIndex(t => t.id === highlightedTaskId)
  
  // Arrow keys move through all tasks seamlessly
  if (e.key === 'ArrowDown') {
    const nextTask = allVisibleTasks[currentIndex + 1]
    if (nextTask) {
      setHighlightedTaskId(nextTask.id)
      scrollTaskIntoView(nextTask.id)
    }
  }
  // ... other keys
}
```

## Success Criteria

1. **No Behavioral Differences**: Single and multi-list modes behave identically
2. **Seamless Navigation**: Keyboard navigation works across all lists
3. **Performance**: No lag with 10+ lists loaded
4. **State Consistency**: No focus jumping or state sync issues
5. **Code Simplification**: Fewer lines of code than current implementation

## Timeline

- **Week 1**: Unified component foundation
- **Week 2**: Complete settings system
- **Week 3**: Enhanced list features
- **Week 4**: Bulk operations
- **Week 5**: Context menu and polish
- **Week 6**: Testing and bug fixes

## Next Steps

1. Create `UnifiedListView.tsx` component
2. Implement basic structure with mode detection
3. Port single-list functionality
4. Add multi-list rendering
5. Test and iterate

This unified approach will eliminate all current bugs and provide a solid foundation for future enhancements.