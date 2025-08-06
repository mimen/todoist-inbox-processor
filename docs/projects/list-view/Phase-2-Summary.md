# List View Phase 2 - Implementation Summary

## Quick Reference

Phase 2 transforms the single list view into a powerful multi-list system with bulk operations.

## Core Decisions

### Multi-List Display
- **Order**: Follow dropdown order exactly (Inbox → Overdue → Today → P1 → Priority Projects → etc.)
- **Loading**: Progressive loading as user scrolls, no artificial limits
- **Empty Lists**: Show minimal "[List Name] has no tasks" message
- **Spacing**: Appropriate gaps between lists with collapsible functionality

### Settings System
- **UI**: Gear icon → popup modal (minimal main UI impact)
- **Settings**:
  - Multi-list mode toggle (on/off)
  - Duplicate filtering toggle (global)
- **Storage**: localStorage

### Duplicate Filtering
- **Behavior**: Tasks appear only in their first list
- **Scope**: Global setting across all processing modes
- **Default**: Off (show tasks in all lists they belong to)

### Bulk Operations
- **Selection**: Already implemented (Cmd+Click, Shift+Click)
- **Actions**: Complete, Delete, Assign Project, Set Priority, Add/Remove Labels
- **Multi-Task Scheduling**: Sequential one-by-one in normal scheduler

### Visual Enhancements
- **List Headers**: Add icons (project colors, priority flags, etc.)
- **Context Menu**: Right-click for quick actions
- **Descriptions**: Edit/add in expanded view (lower priority)

## Implementation Phases

### Phase 2.1: Foundation (Week 1-2)
1. Multi-list container component
2. Progressive loading logic
3. Settings system with gear icon
4. Multi-list mode toggle

### Phase 2.2: Core Features (Week 3-4)
1. Collapsible lists
2. Duplicate filtering
3. Empty list handling
4. Enhanced list headers

### Phase 2.3: Power Features (Week 5-6)
1. Bulk action bar
2. Multi-task scheduling queue
3. Right-click context menu
4. Description editing

## Key Technical Points

1. **Reuse dropdown order logic** - Don't duplicate the prioritized queue logic
2. **Maintain single data source** - masterTasks remains source of truth
3. **Viewport detection** - Use Intersection Observer for progressive loading
4. **State management** - Consider useReducer for complex multi-list state
5. **Performance** - Monitor and optimize only when issues arise

## MVP Definition

**Must Have:**
- Multi-list display following dropdown order
- Progressive loading
- Settings with multi-list toggle
- Duplicate filtering option
- Basic bulk operations (complete, delete)

**Nice to Have:**
- Collapsible lists
- Enhanced headers with icons
- Multi-task scheduling
- Right-click menu
- Description editing

## Next Action

Begin with `LV2-001: Create Multi-List Container Component` that:
1. Renders multiple ListView components
2. Follows dropdown order from current processing mode
3. Implements progressive loading with Intersection Observer
4. Manages individual list states (sort, collapsed, etc.)