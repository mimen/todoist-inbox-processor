# List View Feature - Phase 2 Task Breakdown

## Phase 2 Overview

This document outlines the Phase 2 enhancements for the List View feature, focusing on multi-list viewing, bulk operations, and enhanced functionality.

---

## Phase 2 Features & Clarifying Questions

### 1. Multi-List Sequential Display with Virtual Scrolling

**Concept**: Display multiple queues/lists sequentially, loading them progressively as the user scrolls.

**Key Requirements**:
- Show lists one after another vertically
- Each list maintains its own header, content, and footer
- Progressive loading: Load first list, then load additional lists only if there's viewport space
- Continue loading more lists as user scrolls down
- Each list maintains its sort preference independently

**Decision**: Follow the exact order of the current processing mode's dropdown. Use the same prioritized queue logic that determines "next queue" in processing view. If the dropdown is sorted (e.g., projects by hierarchy/priority/name), maintain that sort order for the lists.

**Decision**: No artificial limits - keep loading lists as the user scrolls. We'll monitor performance and add limits only if issues arise.

**Decision**: Appropriate spacing between lists with collapsible functionality. Each list can be collapsed/expanded independently.

**Decision**: Show empty lists with a minimal message like "[List Name] has no tasks" instead of the full list header. Keep it clean and unobtrusive.

---

### 2. Settings System & Preferences

**Concept**: Add a settings system to control List View behavior, stored in localStorage.

**Key Settings**:
- **Multi-List Mode**: Toggle between single list and multi-list view
- **Duplicate Filtering**: When enabled, tasks only appear in the first list they belong to within the current processing mode's set of lists. Each task shows exactly once across all visible lists.

**Decision**: Gear icon that opens a settings popup/modal. Minimal impact on the main UI with all complexity in the popup. For now, only the multi-list mode toggle goes here. Existing settings that already have UI placement stay where they are.

**Decision**: Duplicate filter setting is global (applies to all processing modes). Keep settings simple for now.

---

### 3. Bulk Operations Across Multiple Lists

**Concept**: Select tasks across different lists and perform bulk actions.

**Key Operations**:
- Select multiple tasks (already implemented with Cmd+Click, Shift+Click)
- Bulk complete
- Bulk delete
- Bulk assign to project
- Bulk set priority
- Bulk add/remove labels
- Bulk schedule (special multi-task scheduling mode)

**Clarifying Questions**:
1. **Selection Persistence**: When switching between single/multi-list view, should selections persist?

2. **Bulk Actions UI**: How should bulk actions be triggered?
   - Floating action bar when items selected?
   - Right-click context menu?
   - Keyboard shortcuts?
   - All of the above?

3. **Confirmation**: Which bulk operations need confirmation dialogs?
   - Delete definitely needs confirmation
   - Complete might need confirmation if >X tasks
   - Others?

4. **Selection Limits**: Should we limit the number of tasks that can be selected at once?

---

### 4. Multi-Task Scheduling Mode

**Concept**: Select multiple tasks and enter a special scheduling queue where you schedule them one by one using the existing scheduler.

**Proposed Flow**:
1. Select multiple tasks
2. Choose "Schedule All" action
3. Enter scheduling mode showing first task
4. Schedule it using existing scheduler UI
5. Automatically advance to next task
6. Continue until all tasks scheduled or user exits

**Decision**: Present tasks in selection order (the order they were selected by the user).

2. **Skip Options**: Should users be able to:
   - Skip a task (schedule later)?
   - Cancel remaining tasks?
   - Jump to a specific task?

**Decision**: Keep it simple - schedule multiple tasks one-by-one using the normal scheduler. Smart/batch scheduling can be considered for a future phase.

4. **Progress Indicator**: How to show progress through the scheduling queue?

---

### 5. Enhanced List Headers

**Concept**: Show more context in list headers including icons, colors, and metadata.

**Enhanced Information**:
- **Projects**: Show project color dot
- **Priorities**: Show priority flag icon
- **Labels**: Show label icon/color
- **Custom Queues**: Show custom icon
- **Task Count**: Already shown
- **Additional Metadata**: Due dates? Assignees?

**Clarifying Questions**:
1. **Project Metadata**: Should we show project metadata (priority, due date) in header?

2. **Header Actions**: Should headers be interactive?
   - Click to collapse/expand list?
   - Quick actions menu?
   - Inline add task button?

3. **Header Stats**: What statistics would be useful?
   - Completed today count?
   - Overdue count?
   - Average task age?

---

### 6. Right-Click Context Menu

**Concept**: Add right-click context menu for quick actions on tasks.

**Menu Options**:
- Complete Task
- Edit Task
- Delete Task
- Duplicate Task
- Move to Project...
- Set Priority...
- Add Labels...
- Schedule...
- View Details
- Copy Task Link

**Clarifying Questions**:
1. **Multi-Select Context Menu**: Different options when multiple tasks selected?

2. **Keyboard Alternative**: Should we have a keyboard shortcut to open context menu?

3. **Mobile Alternative**: Long-press for touch devices?

---

### 7. Description Editing

**Concept**: Add ability to edit task descriptions and add descriptions to tasks without them.

**Requirements**:
- Show description in expanded state
- Click to edit existing descriptions
- Add description button for tasks without
- Rich text or plain text?
- Auto-save or explicit save?

**Clarifying Questions**:
1. **Inline vs Modal**: Edit descriptions inline or in a modal?

2. **Markdown Support**: Should we support markdown in descriptions?

3. **Description Preview**: Show first line of description when collapsed?

---

## Phase 2 Task List (Draft)

### Work Stream 1: Multi-List Infrastructure
- [ ] **LV2-001**: Create Multi-List Container Component
- [ ] **LV2-002**: Implement Progressive List Loading Logic  
- [ ] **LV2-003**: Add List Order Management
- [ ] **LV2-004**: Implement List Unloading for Performance
- [ ] **LV2-005**: Create List Separator Components

### Work Stream 2: Settings System
- [ ] **LV2-006**: Create Settings Data Model & localStorage
- [ ] **LV2-007**: Build Settings UI Component
- [ ] **LV2-008**: Implement Multi-List Mode Toggle
- [ ] **LV2-009**: Implement Duplicate Task Filtering
- [ ] **LV2-010**: Add Per-List Sort Preferences

### Work Stream 3: Bulk Operations
- [ ] **LV2-011**: Create Bulk Actions Bar Component
- [ ] **LV2-012**: Implement Bulk Complete with Confirmation
- [ ] **LV2-013**: Implement Bulk Delete with Confirmation
- [ ] **LV2-014**: Implement Bulk Project Assignment
- [ ] **LV2-015**: Implement Bulk Priority Setting
- [ ] **LV2-016**: Implement Bulk Label Operations
- [ ] **LV2-017**: Create Multi-Task Scheduling Queue

### Work Stream 4: Enhanced Headers
- [ ] **LV2-018**: Add Icon System for List Headers
- [ ] **LV2-019**: Implement Color Indicators
- [ ] **LV2-020**: Add Header Metadata Display
- [ ] **LV2-021**: Create Collapsible List Functionality

### Work Stream 5: Context Menu
- [ ] **LV2-022**: Create Context Menu Component
- [ ] **LV2-023**: Implement Right-Click Handler
- [ ] **LV2-024**: Add Touch/Long-Press Support
- [ ] **LV2-025**: Integrate with Existing Actions

### Work Stream 6: Description Management  
- [ ] **LV2-026**: Add Description Display in Expanded View
- [ ] **LV2-027**: Implement Description Editing
- [ ] **LV2-028**: Add "Add Description" Button
- [ ] **LV2-029**: Implement Description Auto-Save

---

## Implementation Order Recommendation

1. **Foundation**: Multi-List Infrastructure + Settings System (enables everything else)
2. **Visual Polish**: Enhanced Headers (improves multi-list experience)
3. **Power Features**: Bulk Operations + Context Menu (major productivity boost)
4. **Refinements**: Description Management (nice to have)

---

## Technical Considerations

1. **Performance**: With multiple lists visible, we need efficient rendering
   - Consider intersection observer for viewport detection
   - Implement list virtualization per list
   - Lazy load list contents

2. **State Management**: Complex state with multiple lists
   - Consider using reducer pattern
   - Maintain selection state across lists
   - Handle cross-list operations

3. **Data Consistency**: Ensure task updates reflect across all lists
   - Single source of truth (masterTasks)
   - Efficient update propagation
   - Handle task movement between lists

4. **Mobile Experience**: Multi-list on mobile needs special consideration
   - Single column layout
   - Collapsible lists more important
   - Touch-friendly bulk operations

---

## All Decisions Finalized ✅

1. **List Order**: Follow current processing mode's dropdown order exactly
2. **Settings UI**: Gear icon with popup modal (minimal main UI impact)
3. **List Visuals**: Appropriate spacing with collapsible lists
4. **Empty Lists**: Show with minimal "[List Name] has no tasks" message
5. **Performance**: No limits - keep loading lists as user scrolls
6. **Duplicate Filtering**: Global setting that shows tasks only once (in first list)
7. **Multi-Task Scheduling**: One-by-one using normal scheduler (no batch options)
8. **Settings Scope**: Keep simple - duplicate filter is global

## Implementation Priority

Based on your input, here's the recommended order:

1. **Foundation** (Week 1-2)
   - Multi-list container following dropdown order
   - Progressive viewport-based loading
   - Basic settings system with gear icon

2. **Core Features** (Week 3-4)
   - Collapsible lists with proper spacing
   - Duplicate filtering toggle
   - Bulk selection UI

3. **Power Features** (Week 5-6)
   - Multi-task scheduling queue
   - Right-click context menu
   - Enhanced list headers

4. **Polish** (As time permits)
   - Description editing
   - Performance optimization
   - Mobile touch support