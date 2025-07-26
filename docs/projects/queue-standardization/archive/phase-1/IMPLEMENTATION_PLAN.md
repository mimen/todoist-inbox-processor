# Queue Standardization Implementation Plan

## Project Overview
Implement standardized dropdown components and queue progression system for the Todoist Inbox Processor.

## Phase Tracking

| Phase | Name | Duration | Status | Start Date | End Date |
|-------|------|----------|---------|------------|----------|
| 1 | Core Interfaces | 1 day | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 2 | Option Providers | 2 days | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 3 | Unified Dropdown | 3 days | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 4 | Migrate Dropdowns | 3 days | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 5 | Queue Progression | 2 days | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 6 | Next Queue UI | 2 days | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 7 | Future-Proofing | 1 day | ✅ Completed | 2025-01-24 | 2025-01-24 |
| 8 | Multi-Select | 2 days | Future | - | - |

## Phase 1: Create Core Interfaces and Types (1 day)

### Objectives
- Define all TypeScript interfaces
- Create type definitions
- Set up project structure

### Tasks
1. **Create type files** (2 hours)
   - [ ] Create `types/dropdown.ts` with DropdownOption and DropdownConfig
   - [ ] Create `types/queue.ts` with QueueState and related types
   - [ ] Update `types/processing-mode.ts` with queue fields
   - [ ] Create `types/index.ts` to export all types

2. **Create constants** (1 hour)
   - [ ] Create `constants/date-options.ts` with DATE_OPTIONS array
   - [ ] Create `constants/deadline-options.ts` with DEADLINE_OPTIONS array
   - [ ] Create `constants/priority-options.ts` with PRIORITY_OPTIONS array
   - [ ] Create `constants/queue-config.ts` with default configurations

3. **Update existing types** (1 hour)
   - [ ] Add queue-related fields to ProcessingMode interface
   - [ ] Ensure backward compatibility with existing code
   - [ ] Add JSDoc comments for all new types

4. **Create placeholder JSON config** (0.5 hours)
   - [ ] Create `config/queue-config.json` with empty structure
   - [ ] Add types for JSON schema validation
   - [ ] Document config file format

### Deliverables
- Complete type system for dropdowns and queues
- Constants for all fixed dropdown options
- Placeholder configuration structure

### Success Criteria
- All types compile without errors
- Existing code still works with updated types
- Clear documentation for each interface

---

## Phase 2: Build Option Providers (2 days)

### Objectives
- Create hooks that convert data to DropdownOption format
- Standardize count calculation
- Implement sorting logic

### Day 1 Tasks
1. **Create base hook** (2 hours)
   - [ ] Create `hooks/useDropdownOptions.ts` base implementation
   - [ ] Implement common count calculation logic
   - [ ] Add sorting utilities

2. **Project options hook** (3 hours)
   - [ ] Create `hooks/useProjectOptions.ts`
   - [ ] Handle project hierarchy (parent/child relationships)
   - [ ] Calculate task counts per project
   - [ ] Support different sort options (default, name, priority, count)
   - [ ] Handle inbox project specially

3. **Priority options hook** (2 hours)
   - [ ] Create `hooks/usePriorityOptions.ts`
   - [ ] Always return exactly 4 options (P1-P4)
   - [ ] Calculate counts for each priority level
   - [ ] Support reverse order configuration

### Day 2 Tasks
1. **Label options hook** (2 hours)
   - [ ] Create `hooks/useLabelOptions.ts`
   - [ ] Sort by count (default) or name
   - [ ] Support excluding specific labels
   - [ ] Handle label colors

2. **Date options hook** (2 hours)
   - [ ] Create `hooks/useDateOptions.ts`
   - [ ] Implement date range filtering (overdue, today, tomorrow, etc.)
   - [ ] Add recurring tasks filter
   - [ ] Calculate counts for each range

3. **Deadline options hook** (1.5 hours)
   - [ ] Create `hooks/useDeadlineOptions.ts`
   - [ ] Similar to date but for deadline field
   - [ ] No recurring filter needed

4. **Preset and other hooks** (1.5 hours)
   - [ ] Create `hooks/usePresetOptions.ts`
   - [ ] Create `hooks/useAllOptions.ts` for All mode dropdown
   - [ ] Ensure consistent pattern across all hooks

### Deliverables
- 7-8 option provider hooks
- Consistent data transformation
- Standardized count calculation

### Success Criteria
- Each hook returns proper DropdownOption[]
- Counts match current dropdown implementations
- Sorting works as specified

---

## Phase 3: Create Unified Dropdown Component (3 days)

### Objectives
- Build single dropdown component supporting all features
- Implement icon rendering system
- Support all interaction patterns

### Day 1: Core Component Structure
1. **Component setup** (2 hours)
   - [ ] Create `components/UnifiedDropdown.tsx`
   - [ ] Define props interface and ref handling
   - [ ] Set up state management (open/closed, search, keyboard nav)

2. **Basic rendering** (3 hours)
   - [ ] Implement dropdown button with count badge
   - [ ] Create dropdown panel with options list
   - [ ] Add click-outside detection
   - [ ] Implement open/close animations

### Day 2: Features Implementation
1. **Search functionality** (2 hours)
   - [ ] Add search input for configured dropdowns
   - [ ] Implement fuzzy search on option labels
   - [ ] Maintain keyboard navigation with search

2. **Keyboard navigation** (2 hours)
   - [ ] Arrow keys for navigation
   - [ ] Enter to select
   - [ ] Escape to close
   - [ ] Tab to move focus

3. **Selection handling** (2 hours)
   - [ ] Single-select mode implementation
   - [ ] Prepare structure for future multi-select
   - [ ] Handle onChange callbacks properly

### Day 3: Icon System and Polish
1. **Create OptionIcon component** (2 hours)
   - [ ] Create `components/OptionIcon.tsx`
   - [ ] Implement type-based icon rendering
   - [ ] Support all option types

2. **Hierarchical display** (2 hours)
   - [ ] Implement indentation for child items
   - [ ] Maintain parent-child visual relationship
   - [ ] Ensure keyboard nav works with hierarchy

3. **Polish and edge cases** (2 hours)
   - [ ] Loading states
   - [ ] Empty states
   - [ ] Error handling
   - [ ] Accessibility (ARIA labels, roles)

### Deliverables
- Complete UnifiedDropdown component
- OptionIcon component for consistent icon rendering
- Full feature parity with existing dropdowns

### Success Criteria
- All current dropdown features work in unified component
- Keyboard navigation is smooth
- Search works when enabled
- Icons render correctly for all types

---

## Phase 4: Migrate Existing Dropdowns (3 days)

### Objectives
- Replace existing dropdowns with UnifiedDropdown
- Maintain exact same behavior
- Ensure no regression in functionality

### Day 1: Simple Dropdowns
1. **PriorityDropdown migration** (2 hours)
   - [ ] Create new implementation using UnifiedDropdown
   - [ ] Test side-by-side with old implementation
   - [ ] Ensure counts and behavior match exactly
   - [ ] Update imports in ProcessingModeSelector

2. **All mode dropdown migration** (2 hours)
   - [ ] Migrate all mode options to unified format
   - [ ] Verify sort functionality works
   - [ ] Test with large task lists

3. **DateDropdown migration** (2 hours)
   - [ ] Implement 6 date ranges
   - [ ] Ensure date filtering logic matches
   - [ ] Test recurring task filter

### Day 2: Complex Dropdowns
1. **ProjectDropdown migration** (3 hours)
   - [ ] Handle hierarchy display
   - [ ] Implement search
   - [ ] Ensure project colors work
   - [ ] Test with many projects

2. **LabelDropdown migration** (3 hours)
   - [ ] Keep multi-select for now (don't change behavior)
   - [ ] Implement search
   - [ ] Handle label exclusion
   - [ ] Test count calculations

### Day 3: Remaining Dropdowns
1. **DeadlineDropdown migration** (2 hours)
   - [ ] Implement 5 deadline ranges
   - [ ] Match existing filtering logic

2. **PresetDropdown migration** (2 hours)
   - [ ] Convert preset filters to options
   - [ ] Ensure complex filtering still works

3. **Testing and cleanup** (2 hours)
   - [ ] Remove old dropdown components
   - [ ] Update all imports
   - [ ] Run full app testing
   - [ ] Fix any edge cases

### Deliverables
- All dropdowns using UnifiedDropdown
- Old dropdown components removed
- No change in user-facing behavior

### Success Criteria
- App works exactly as before
- No visual or functional regressions
- Code is cleaner and more maintainable

---

## Phase 5: Implement Queue Progression (2 days)

### Objectives
- Add queue state management
- Implement progression logic
- Integrate with ProcessingModeSelector

### Day 1: Queue State Management
1. **Create useQueueProgression hook** (3 hours)
   - [ ] Create `hooks/useQueueProgression.ts`
   - [ ] Implement queue state management
   - [ ] Add progression methods
   - [ ] Track completed queues

2. **Integrate with ProcessingModeSelector** (3 hours)
   - [ ] Add queue progression hook
   - [ ] Update mode changes to include queue info
   - [ ] Ensure queue follows dropdown order

### Day 2: Integration and Testing
1. **TaskProcessor integration** (2 hours)
   - [ ] Detect when queue is complete
   - [ ] Trigger next queue prompt
   - [ ] Handle mode switching with queues

2. **Queue persistence** (2 hours)
   - [ ] Add completed queue tracking
   - [ ] Prepare for future state persistence
   - [ ] Handle page refreshes gracefully

3. **Edge cases** (2 hours)
   - [ ] Last queue in sequence
   - [ ] Empty queues
   - [ ] Mode switching mid-queue
   - [ ] Manual queue selection

### Deliverables
- Working queue progression system
- Integration with existing components
- Proper state management

### Success Criteria
- Can progress through queues in order
- State is maintained correctly
- No interference with manual selection

---

## Phase 6: Add Next Queue UI (2 days)

### Objectives
- Create UI for queue completion
- Implement smooth transitions
- Add keyboard shortcuts

### Day 1: Component Development
1. **Create NextQueuePrompt component** (3 hours)
   - [ ] Create `components/NextQueuePrompt.tsx`
   - [ ] Design completion message UI
   - [ ] Show next queue with icon and count
   - [ ] Add keyboard shortcut hints

2. **Styling and animations** (2 hours)
   - [ ] Match existing app design
   - [ ] Add entrance/exit animations
   - [ ] Ensure responsive design

### Day 2: Integration
1. **TaskProcessor integration** (2 hours)
   - [ ] Show prompt when queue is empty
   - [ ] Handle continue action
   - [ ] Handle dismiss action

2. **Keyboard shortcuts** (2 hours)
   - [ ] Add → key to continue to next queue
   - [ ] Add Escape to dismiss prompt
   - [ ] Update keyboard shortcuts help

3. **Testing and polish** (2 hours)
   - [ ] Test all queue types
   - [ ] Verify smooth transitions
   - [ ] Handle rapid progression
   - [ ] Test with empty next queue

### Deliverables
- Complete next queue prompt UI
- Smooth queue transitions
- Keyboard shortcut support

### Success Criteria
- Clear and intuitive UI
- Smooth animations
- Quick queue progression
- No jarring transitions

---

## Phase 7: Future-Proofing (1 day)

### Objectives
- Add infrastructure for future features
- Document extension points
- Create development guide

### Tasks
1. **JSON configuration loader** (2 hours)
   - [ ] Create config loading utilities
   - [ ] Add config validation
   - [ ] Use hardcoded config for now
   - [ ] Document how to enable JSON loading

2. **Extension documentation** (2 hours)
   - [ ] Document how to add new queue types
   - [ ] Create guide for custom sort functions
   - [ ] Document state persistence hooks

3. **Placeholder features** (2 hours)
   - [ ] Add interfaces for custom queues
   - [ ] Create examples of future features
   - [ ] Add TODO comments for future work

### Deliverables
- Configuration infrastructure
- Extension documentation
- Clear path for future features

---

## Phase 8: Multi-Select Support (Future - 2 days)

### Objectives
- Add multi-select capability to any dropdown
- Update queue processing for multiple selections

### Current Issues Found
- UnifiedDropdown already supports multi-select UI (checkboxes work)
- JSON config can enable/disable multi-select per dropdown type
- However, parent components expect single values, causing issues when switching modes
- LabelDropdown breaks in single-select mode due to array/string mismatch
- Other dropdowns only use first value when multi-select is enabled

### Tasks
1. **Standardize value handling across all dropdowns**
   - [ ] Create useDropdownAdapter hook for value normalization (partially done)
   - [ ] Update all dropdown components to handle both single/array values
   - [ ] Ensure smooth switching between modes via JSON config

2. **Update parent components to handle arrays**
   - [ ] Modify ProcessingModeSelector to accept array values for all modes
   - [ ] Update ProcessingMode type to support `value: string | string[]`
   - [ ] Change all onModeChange callbacks to handle arrays

3. **Update filtering logic**
   - [ ] Modify task-filters.ts to support multiple values per mode
   - [ ] Enable filtering by multiple projects, priorities, etc.
   - [ ] Update filter display to show multiple selections

4. **Fix immediate issues**
   - [ ] Fix LabelDropdown single-select mode
   - [ ] Make other dropdowns properly handle multi-select values
   - [ ] Add proper TypeScript types for multi-mode values

5. **Testing**
   - [ ] Test all dropdowns in both single and multi modes
   - [ ] Verify JSON config changes work dynamically
   - [ ] Ensure no regression in existing functionality

---

## Testing Strategy

### Unit Testing
- Test each option provider hook
- Test UnifiedDropdown component
- Test queue progression logic
- Test icon rendering

### Integration Testing
- Test full user flows
- Test keyboard navigation
- Test queue progression
- Test configuration changes

### Performance Testing
- Large numbers of projects/labels
- Count calculation performance
- Search performance
- Render performance

---

## Risk Mitigation

### Risks and Mitigations
1. **Risk**: Breaking existing functionality
   - **Mitigation**: Gradual migration, extensive testing

2. **Risk**: Performance regression
   - **Mitigation**: Profile before/after, optimize counts

3. **Risk**: Complex state management
   - **Mitigation**: Clear state boundaries, good documentation

4. **Risk**: User confusion with new UI
   - **Mitigation**: Maintain exact same behavior initially

---

## Success Metrics
What's
1. **Code Quality**
   - Reduced code duplication (8 dropdowns → 1)
   - Better TypeScript coverage
   - Easier to add new features

2. **User Experience**
   - Smooth queue progression
   - Consistent dropdown behavior
   - No functional regressions

3. **Performance**
   - No increase in render time
   - Efficient count calculations
   - Smooth animations

---

## Next Steps After Completion

1. Gather user feedback on next queue feature
2. Implement JSON configuration loading
3. Add dropdown sorting UI
4. Implement multi-select for all modes
5. Create custom queue builder UI
6. Add state persistence