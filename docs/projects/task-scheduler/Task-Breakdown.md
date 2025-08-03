# Task Scheduler Feature - Task Breakdown

## Overview
This document provides a comprehensive task breakdown for implementing the task scheduler feature in the Todoist Inbox Processor application. The feature allows users to schedule tasks into fixed 30-minute time slots with keyboard navigation and Google Calendar integration.

## Implementation Phases

### Phase 1: Core UI Components (Mock Data)

#### Task: [TS-001] - Create Calendar Grid Component
**Complexity**: 5 points
**Dependencies**: None

**Description**:
Create the main calendar grid component that displays a day view with 15-minute time marks. The component should render a vertical timeline with 15-minute increments for precise positioning of 30-minute task blocks.

**Acceptance Criteria**:
- [ ] Calendar grid displays single day view (vertical timeline)
- [ ] Time marks at 15-minute increments (e.g., 9:00, 9:15, 9:30, 9:45)
- [ ] Grid shows 24-hour timeline (or configured working hours)
- [ ] Current time indicator for today's view
- [ ] Time labels are clearly visible on the left side
- [ ] Only future time slots shown for current day

**Technical Notes**:
- Use CSS Grid or Flexbox for layout
- Component path: `components/TaskScheduler/CalendarGrid.tsx`
- Mock data structure should match future API response format
- Consider performance for rendering many time slots

**Definition of Done**:
- Component renders correctly with mock data
- TypeScript types defined for grid data structure
- Basic styling applied matching app design system
- Component is composable and accepts props for customization

---

#### Task: [TS-002] - Create Time Slot Component
**Complexity**: 3 points
**Dependencies**: None

**Description**:
Build time slot components that represent 15-minute positions where 30-minute tasks can be placed. Must handle validation for sufficient clearance.

**Acceptance Criteria**:
- [ ] Slot represents 15-minute position on timeline
- [ ] Visual states: available (30-min clear), unavailable, selected, preview
- [ ] Shows task preview as 30-minute block when selected
- [ ] Click positions any 15-minute mark
- [ ] Keyboard navigation only highlights positions with 30-min clearance
- [ ] Calendar events display side-by-side by default

**Technical Notes**:
- Component path: `components/TaskScheduler/TimeSlot.tsx`
- Use data attributes for slot identification
- Implement proper ARIA labels
- Consider memoization for performance

**Definition of Done**:
- Component handles all visual states correctly
- Click events properly bubbled to parent
- TypeScript interfaces for props defined
- Unit tests for state rendering

---

#### Task: [TS-003] - Integrate with Existing Overlay System
**Complexity**: 4 points
**Dependencies**: [TS-001], [TS-002]

**Description**:
Replace existing schedule/deadline overlays with the new task scheduler. Reuse existing overlay infrastructure and patterns.

**Acceptance Criteria**:
- [ ] Replaces DatePickerOverlay for schedule/deadline selection
- [ ] Maintains same props interface for seamless integration
- [ ] Uses existing overlay context and state management
- [ ] Escape key closes the overlay
- [ ] Integrates with existing keyboard shortcut system
- [ ] Shows task preview in selected time slot

**Technical Notes**:
- Component path: `components/TaskScheduler/SchedulerOverlay.tsx`
- Reuse existing overlay utilities/hooks if available
- Use React Portal for rendering
- Implement focus management hooks

**Definition of Done**:
- Overlay behavior matches existing app patterns
- Keyboard navigation for open/close works
- Animation transitions are smooth
- Integration point with TaskProcessor component identified

---

#### Task: [TS-004] - Create Day Navigation Controls
**Complexity**: 2 points
**Dependencies**: [TS-001]

**Description**:
Build controls for navigating between days and optional date picker for distant dates.

**Acceptance Criteria**:
- [ ] Previous/Next day buttons functional
- [ ] "Today" button returns to current day
- [ ] Current date clearly displayed
- [ ] Left/Right arrows or Tab/Shift+Tab for day navigation
- [ ] Optional date picker ('d' key) for distant dates
- [ ] Clear button (Shift+Delete) to remove date selection

**Technical Notes**:
- Component path: `components/TaskScheduler/DayNavigation.tsx`
- Use date-fns for date calculations
- Integrate existing date picker component

**Definition of Done**:
- Navigation updates calendar grid correctly
- Date calculations handle edge cases (year boundaries)
- Keyboard shortcuts documented
- Visual feedback for user actions

---

### Phase 2: Keyboard Navigation

#### Task: [TS-005] - Implement 15-Minute Grid Navigation
**Complexity**: 8 points
**Dependencies**: [TS-001], [TS-002], [TS-003]

**Description**:
Implement keyboard navigation that moves in 15-minute increments but only stops at positions with 30-minute clearance for task placement.

**Acceptance Criteria**:
- [ ] Up/Down arrows move 15 minutes at a time
- [ ] Navigation skips positions without 30-min clearance
- [ ] First Enter shows task preview (30-min block)
- [ ] Second Enter confirms selection
- [ ] Visual indicator shows 30-min task at current position
- [ ] Cannot keyboard navigate to positions with conflicts
- [ ] Mouse can click any 15-min position

**Technical Notes**:
- Use React refs for focus management
- Implement custom hook: `useGridKeyboardNavigation`
- Consider virtualization for performance
- Store navigation state in React context

**Definition of Done**:
- All keyboard shortcuts work as specified
- Focus indicator clearly visible
- Navigation feels responsive and intuitive
- Keyboard navigation documented in help modal

---

#### Task: [TS-006] - Integrate Scheduler with Existing Shortcuts
**Complexity**: 2 points
**Dependencies**: [TS-003]

**Description**:
Integrate the task scheduler to open when using existing 's' (scheduled) and 'd' (deadline) shortcuts.

**Acceptance Criteria**:
- [ ] 's' key opens scheduler in scheduled mode
- [ ] 'd' key opens scheduler in deadline mode
- [ ] Replaces existing date picker overlays
- [ ] Maintains backward compatibility
- [ ] Help documentation updated

**Technical Notes**:
- Integrate with existing keyboard shortcut system
- Add to `useKeyboardShortcuts` hook
- Update help documentation

**Definition of Done**:
- Shortcut works consistently
- No conflicts with existing shortcuts
- Help documentation updated
- Visual indicator when shortcut is available

---

#### Task: [TS-007] - Implement Two-Step Confirmation Flow
**Complexity**: 3 points
**Dependencies**: [TS-005]

**Description**:
Create two-step confirmation mechanism: first action shows preview, second confirms.

**Acceptance Criteria**:
- [ ] First Enter/click shows task preview in slot
- [ ] Preview shows as 30-minute purple block
- [ ] Second Enter/click confirms and saves
- [ ] Escape cancels at any stage
- [ ] No warning prompts for conflicts
- [ ] Visual distinction between preview and confirmed state

**Technical Notes**:
- Implement optimistic UI updates
- Handle loading states during API calls
- Consider undo functionality

**Definition of Done**:
- Selection flow feels natural
- Clear visual feedback at each step
- Error states handled gracefully
- Confirmation can be disabled in settings

---

### Phase 3: Calendar Integration

#### Task: [TS-008] - Set Up Hardcoded Calendar Access
**Complexity**: 3 points
**Dependencies**: None

**Description**:
Implement hardcoded Google Calendar API integration for MVP, similar to current Todoist approach.

**Acceptance Criteria**:
- [ ] Hardcoded API key/credentials in environment variables
- [ ] API route for fetching calendar events
- [ ] Support for multiple calendar IDs
- [ ] Error handling for API failures
- [ ] PST timezone locked for all times

**Technical Notes**:
- API route: `/api/calendar/config` and `/api/calendar/events`
- Use Google Calendar API v3 with API key
- Environment variables for credentials
- Future: OAuth implementation documented

**Definition of Done**:
- Calendar events load successfully
- API errors handled gracefully
- TypeScript types for calendar data
- Future OAuth path documented

---

#### Task: [TS-009] - Create Calendar Service with Visibility Toggles
**Complexity**: 5 points
**Dependencies**: [TS-008]

**Description**:
Build service layer for fetching calendar events with local storage for visibility preferences.

**Acceptance Criteria**:
- [ ] Fetch events for current day view
- [ ] Cache events to minimize API calls
- [ ] Calendar visibility toggles with checkboxes
- [ ] Visibility preferences persist in localStorage
- [ ] All calendars visible by default
- [ ] Show calendar colors and names

**Technical Notes**:
- Service path: `lib/calendar/CalendarService.ts`
- Implement caching with TTL
- Handle timezone conversions
- Consider recurring events

**Definition of Done**:
- Service methods are well-documented
- Caching reduces API calls significantly
- All event types handled correctly
- Performance optimized for week view

---

#### Task: [TS-010] - Display Events Side-by-Side
**Complexity**: 5 points
**Dependencies**: [TS-009], [TS-001], [TS-002]

**Description**:
Display calendar events side-by-side by default, only overlapping when space-constrained.

**Acceptance Criteria**:
- [ ] Events display side-by-side when possible
- [ ] Compress width before overlapping
- [ ] Calendar name shown on hover
- [ ] Original calendar colors preserved
- [ ] Loading states while fetching events
- [ ] Only future slots shown for current day

**Technical Notes**:
- Use React Query or SWR for data fetching
- Implement optimistic updates
- Consider partial loading for better UX

**Definition of Done**:
- Calendar events display correctly in grid
- Loading and error states implemented
- Performance remains good with many events
- Visual design matches app aesthetic

---

### Phase 4: Task Scheduling Logic

#### Task: [TS-011] - Create Task Scheduling API Endpoint
**Complexity**: 5 points
**Dependencies**: None

**Description**:
Build API endpoint for scheduling tasks to specific time slots, including validation and Todoist integration.

**Acceptance Criteria**:
- [ ] Endpoint validates slot availability
- [ ] Updates task in Todoist with scheduled time
- [ ] Handles timezone correctly
- [ ] Returns updated task data
- [ ] Supports batch scheduling

**Technical Notes**:
- API route: `/api/tasks/schedule`
- Use Todoist due date/time API
- Implement idempotency for reliability
- Consider optimistic locking

**Definition of Done**:
- API endpoint fully functional
- Request/response types defined
- Error handling comprehensive
- API documentation written

---

#### Task: [TS-012] - Implement Conflict Detection
**Complexity**: 3 points
**Dependencies**: [TS-009], [TS-011]

**Description**:
Build logic to detect scheduling conflicts with existing calendar events and previously scheduled tasks.

**Acceptance Criteria**:
- [ ] Detect overlaps with calendar events
- [ ] Detect overlaps with scheduled tasks
- [ ] Provide clear conflict messages
- [ ] Suggest alternative slots
- [ ] Allow override with confirmation

**Technical Notes**:
- Implement in both frontend and backend
- Consider buffer time between events
- Handle edge cases (DST, etc.)

**Definition of Done**:
- Conflict detection accurate
- User messaging clear
- Alternative suggestions helpful
- Override flow smooth

---

#### Task: [TS-013] - Add Drag and Drop Support
**Complexity**: 5 points
**Dependencies**: [TS-001], [TS-002], [TS-011]

**Description**:
Implement drag and drop functionality for rescheduling tasks within the calendar grid.

**Acceptance Criteria**:
- [ ] Tasks can be dragged between slots
- [ ] Visual feedback during drag
- [ ] Validation during drag (availability)
- [ ] Smooth animation on drop
- [ ] Undo support for moves
- [ ] Keyboard alternative for drag operations

**Technical Notes**:
- Use react-dnd or native drag API
- Implement ghost image for dragging
- Handle touch events for mobile

**Definition of Done**:
- Drag and drop feels natural
- Works on desktop and touch devices
- No performance degradation
- Accessibility maintained

---

#### Task: [TS-014] - Create Task Duration Estimation
**Complexity**: 3 points
**Dependencies**: [TS-011]

**Description**:
Implement system for estimating task duration and showing multi-slot tasks in the grid.

**Acceptance Criteria**:
- [ ] Default duration settings per task type
- [ ] Manual duration override option
- [ ] Visual representation of multi-slot tasks
- [ ] Duration saved with task
- [ ] Smart suggestions based on history

**Technical Notes**:
- Store duration in task metadata
- Consider AI integration for estimates
- Handle partial slot occupancy

**Definition of Done**:
- Duration system intuitive
- Multi-slot display clear
- Settings easily configurable
- Historical data utilized

---

### Phase 5: Polish and Edge Cases

#### Task: [TS-015] - Add Clear Date Function
**Complexity**: 2 points
**Dependencies**: [TS-007]

**Description**:
Implement ability to clear scheduled/deadline dates from tasks.

**Acceptance Criteria**:
- [ ] Shift+Delete keyboard shortcut clears date
- [ ] Clear button visible in UI
- [ ] Confirmation before clearing
- [ ] Works for both scheduled and deadline
- [ ] Updates task immediately

**Technical Notes**:
- Use Intl.DateTimeFormat for display
- Store times in UTC in database
- Handle DST transitions
- Consider timezone abbreviations

**Definition of Done**:
- Timezone handling bulletproof
- User experience consistent
- Edge cases handled
- Documentation complete

---

#### Task: [TS-016] - Implement Calendar Visibility UI
**Complexity**: 3 points
**Dependencies**: [TS-009]

**Description**:
Create UI for toggling calendar visibility with persistent preferences.

**Acceptance Criteria**:
- [ ] Checkbox list of all calendars
- [ ] Calendar colors shown next to names
- [ ] Toggle immediately hides/shows events
- [ ] Preferences saved to localStorage
- [ ] All calendars visible by default

**Technical Notes**:
- Use RRULE standard for patterns
- Consider calendar app patterns
- Handle exceptions in series

**Definition of Done**:
- Common patterns easy to set
- UI clear about recurrence
- Modifications intuitive
- Performance acceptable

---

#### Task: [TS-017] - Optimize Performance for Large Datasets
**Complexity**: 5 points
**Dependencies**: All UI components

**Description**:
Optimize rendering and data handling for users with many tasks and calendar events.

**Acceptance Criteria**:
- [ ] Grid renders smoothly with 1000+ events
- [ ] Scrolling remains at 60fps
- [ ] Initial load time under 2 seconds
- [ ] Memory usage reasonable
- [ ] Virtual scrolling for long time ranges

**Technical Notes**:
- Implement React virtualization
- Use Web Workers for heavy calculations
- Consider IndexedDB for caching
- Profile and optimize renders

**Definition of Done**:
- Performance metrics documented
- Load tests passing
- No memory leaks
- Smooth UX maintained

---

#### Task: [TS-018] - Add Mobile Responsive Design
**Complexity**: 5 points
**Dependencies**: All UI components

**Description**:
Ensure the task scheduler works well on mobile devices with appropriate touch interactions.

**Acceptance Criteria**:
- [ ] Responsive layout for small screens
- [ ] Touch gestures for navigation
- [ ] Appropriate tap targets
- [ ] Optimized mobile calendar view
- [ ] Performance on mobile devices

**Technical Notes**:
- Consider day/agenda view for mobile
- Implement touch gestures
- Test on real devices
- Optimize bundle size

**Definition of Done**:
- Works on major mobile browsers
- Touch interactions natural
- Performance acceptable
- No horizontal scrolling

---

### Phase 6: Testing and Documentation

#### Task: [TS-019] - Write Comprehensive Unit Tests
**Complexity**: 5 points
**Dependencies**: All implementation tasks

**Description**:
Create unit tests for all components, hooks, and utility functions with high coverage.

**Acceptance Criteria**:
- [ ] 80%+ code coverage
- [ ] All components have tests
- [ ] All hooks have tests
- [ ] All utilities have tests
- [ ] Edge cases covered

**Technical Notes**:
- Use React Testing Library
- Mock external dependencies
- Test accessibility
- Use snapshot tests sparingly

**Definition of Done**:
- All tests passing
- Coverage goals met
- Tests run quickly
- CI/CD integration complete

---

#### Task: [TS-020] - Create Integration Tests
**Complexity**: 5 points
**Dependencies**: All implementation tasks

**Description**:
Build integration tests for critical user flows and API interactions.

**Acceptance Criteria**:
- [ ] Schedule task flow tested
- [ ] Calendar integration tested
- [ ] Keyboard navigation tested
- [ ] API endpoints tested
- [ ] Error scenarios covered

**Technical Notes**:
- Use Playwright or Cypress
- Test against real APIs when possible
- Cover happy and unhappy paths
- Test different browsers

**Definition of Done**:
- Critical paths covered
- Tests reliable (no flakes)
- Good error messages
- Documentation for running tests

---

#### Task: [TS-021] - Write User Documentation
**Complexity**: 3 points
**Dependencies**: All implementation tasks

**Description**:
Create comprehensive user documentation for the task scheduler feature.

**Acceptance Criteria**:
- [ ] Getting started guide
- [ ] Keyboard shortcuts reference
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] Video tutorial (optional)

**Technical Notes**:
- Use Markdown format
- Include screenshots
- Keep language simple
- Version documentation

**Definition of Done**:
- Documentation complete
- Reviewed by team
- Accessible from app
- Search-indexed

---

#### Task: [TS-022] - Create Developer Documentation
**Complexity**: 3 points
**Dependencies**: All implementation tasks

**Description**:
Document the technical implementation, architecture decisions, and API references.

**Acceptance Criteria**:
- [ ] Architecture overview
- [ ] API documentation
- [ ] Component documentation
- [ ] State management guide
- [ ] Contributing guidelines

**Technical Notes**:
- Use JSDoc for code
- Generate API docs automatically
- Include diagrams
- Document decisions

**Definition of Done**:
- Code well-commented
- Architecture documented
- APIs documented
- Easy for new developers

---

## Summary

### Total Estimated Points: 98 points

### Critical Path:
1. Core UI Components (TS-001, TS-002, TS-003)
2. Calendar Integration (TS-008, TS-009, TS-010)
3. Task Scheduling Logic (TS-011)
4. Keyboard Navigation (TS-005)
5. Testing and Documentation

### Risk Areas:
- Google Calendar API integration complexity
- Performance with large datasets
- Timezone handling edge cases
- Mobile responsiveness

### Success Metrics:
- Task scheduling time reduced by 50%
- Keyboard navigation coverage 100%
- User satisfaction score > 4.5/5
- Performance metrics within targets