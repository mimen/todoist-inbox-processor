# Product Requirements Document: Task Scheduler Feature

## Executive Summary

The Task Scheduler is a new feature for the todoist-inbox-processor that provides a visual, calendar-integrated interface for scheduling tasks. It addresses the current limitations of date/deadline selection by offering a Google Calendar-inspired day view with intelligent time slot suggestions and efficient keyboard navigation.

## Problem Statement

The current scheduler implementation is inadequate for users who need to:
- View their calendar context when scheduling tasks
- Quickly find available time slots for tasks
- Efficiently schedule multiple tasks in sequence
- Avoid scheduling conflicts with existing commitments

Users are forced to switch between applications and manually check calendars, leading to scheduling inefficiencies and conflicts.

## MVP Scope Note

The MVP will use Todoist's default 30-minute task duration. Advanced duration features are documented in the "Future Phases" section for later implementation.

## Goals and Objectives

### Primary Goals
1. **Contextual Scheduling**: Enable users to see their full day context when scheduling tasks
2. **Efficient Time Selection**: Provide keyboard-driven time slot selection with duration adjustments
3. **Calendar Integration**: Display Google Calendar events alongside tasks for conflict-free scheduling
4. **Beautiful UI**: Create a visually appealing interface that matches Google Calendar's aesthetic

### Success Metrics
- 50% reduction in time spent scheduling tasks
- 75% reduction in scheduling conflicts
- 90% of scheduling actions completed via keyboard
- User satisfaction score of 4.5/5 or higher

## User Stories

### Core User Stories (MVP)

1. **As a user, I want to see my calendar and tasks in one view**
   - So that I can make informed scheduling decisions
   - Acceptance: Calendar events and tasks displayed in unified day view

2. **As a user, I want to navigate available 30-minute time slots**
   - So that I can quickly find open time for tasks
   - Acceptance: Keyboard navigation through unoccupied slots

3. **As a user, I want to see multiple days**
   - So that I can schedule tasks across my week
   - Acceptance: Navigate between days while maintaining context

4. **As a user, I want to schedule over existing events when necessary**
   - So that I can prioritize important tasks
   - Acceptance: Mouse click allows scheduling on any slot

5. **As a user, I want to see all my calendars at once**
   - So that I have full context of my commitments
   - Acceptance: All calendars visible in original colors with source info

## Functional Requirements (MVP)

### Calendar Integration
- **CAL-001**: Display Google Calendar events in read-only mode
- **CAL-002**: Show all user's calendars in their original colors
- **CAL-003**: Display calendar name/source on hover/focus
- **CAL-004**: Support overlapping events with clear visual representation
- **CAL-005**: Use PST timezone exclusively
- **CAL-006**: Calendar visibility toggles with local storage persistence
- **CAL-007**: Hardcoded personal calendar access for MVP (no OAuth)

### Task Scheduling Interface
- **UI-001**: Full-day vertical timeline view (similar to Google Calendar)
- **UI-002**: Visual time grid in 15-minute increments
- **UI-003**: Fixed 30-minute task blocks (Todoist default)
- **UI-004**: Available slot highlighting for keyboard navigation (15-min positions)
- **UI-005**: Side-by-side event display, overlapping only when space constrained
- **UI-006**: Optional date picker for far-future scheduling
- **UI-007**: Task preview shown in selected slot before confirmation
- **UI-008**: Use existing schedule/deadline overlay system

### Keyboard Navigation
- **KEY-001**: Up/Down arrows navigate in 15-minute increments (for 30-min task)
- **KEY-002**: Left/Right arrows or Tab/Shift+Tab navigate between days
- **KEY-003**: First Enter shows task preview, second Enter confirms
- **KEY-004**: Escape closes scheduler
- **KEY-005**: Auto-suggested slots only (no conflict scheduling via keyboard)
- **KEY-006**: Shift+Delete clears current selection

### Mouse Interaction
- **MOUSE-001**: Click any 15-minute position, including over existing events
- **MOUSE-002**: Shows task preview, requires confirmation to save
- **MOUSE-003**: Access date picker for distant dates
- **MOUSE-004**: Clear button to remove current selection

### Time Slot Logic
- **SLOT-001**: Calculate available positions at 15-minute intervals for 30-min task
- **SLOT-002**: Skip positions without 30-min clearance during keyboard nav
- **SLOT-003**: Highlight next available position with 30-min clearance
- **SLOT-004**: Allow mouse selection of any position
- **SLOT-005**: Set scheduled time or deadline based on context
- **SLOT-006**: Only show future time slots for current day

## Non-Functional Requirements

### Performance
- **PERF-001**: Calendar data loads in <500ms
- **PERF-002**: Slot calculation updates in <50ms
- **PERF-003**: Smooth 60fps animations during interactions

### Usability
- **USE-001**: Fully keyboard accessible
- **USE-002**: Visual design consistent with Google Calendar
- **USE-003**: Clear visual feedback for all interactions
- **USE-004**: Accessible color contrast ratios

### Technical
- **TECH-001**: Overlay implementation using existing patterns
- **TECH-002**: Isolated keyboard shortcut context
- **TECH-003**: Integration with existing task update APIs
- **TECH-004**: Responsive design for desktop/tablet

## User Interface

### Visual Design
- Clean, minimal interface inspired by Google Calendar
- Time labels on left side
- All calendar events in original colors (no separate lanes)
- Task overlay on time grid (30-minute blocks)
- Clear visual separation for overlapping events
- Subtle animations for state changes

### Layout Components
1. **Time Grid**: 24-hour vertical timeline with 15-minute marks
2. **Calendar Events**: Side-by-side blocks with calendar source on hover
3. **Task Preview**: 30-minute task block shown on selection
4. **Day Navigation**: Header with date and navigation controls
5. **Date Picker**: Optional calendar widget for distant dates
6. **Available Positions**: Highlighted 15-minute positions with 30-min clearance
7. **Calendar Toggles**: Checkbox list for hiding/showing calendars
8. **Clear Button**: Remove current date selection

## Technical Considerations

### Google Calendar API
- MVP: Hardcoded personal calendar credentials
- Future: OAuth2 authentication flow
- Calendar.events.list API for event retrieval
- Caching strategy for calendar data
- Rate limiting considerations
- Local storage for calendar visibility preferences

### State Management
- Scheduler state isolated from main app
- Keyboard shortcut context switching
- Task update integration

### Data Model
```typescript
interface SchedulerState {
  currentDate: Date
  selectedTimeSlot: TimeSlot
  taskDuration: number // minutes
  calendarEvents: CalendarEvent[]
  availableSlots: TimeSlot[]
}
```

## Implementation Phases

### Phase 1: MVP (Week 1-2)
- Basic day view with 15-minute time grid
- Fixed 30-minute task blocks
- Keyboard navigation at 15-min increments
- Task preview before confirmation
- Use existing overlay system

### Phase 2: Calendar Integration (Week 2-3)
- Hardcoded Google Calendar access
- Event display with original colors
- Side-by-side event visualization
- Calendar visibility toggles with local storage
- PST timezone lock
- Only future time slots for current day

### Phase 3: Polish & Navigation (Week 3-4)
- Multi-day navigation
- Date picker for distant dates
- Refined visual design
- Performance optimization

## Future Phases (Post-MVP)

### Working Hours Configuration
- Define working hours boundaries (e.g., 9 AM - 6 PM)
- Visual distinction between work and personal time
- Option to restrict navigation to working hours only
- Different working hours for different days

### Duration Management Features
The following features are planned for future implementation once Todoist supports task duration:

#### Dynamic Duration Adjustment
- **DUR-001**: Auto-estimate duration based on task content/project
- **DUR-002**: Keyboard shortcuts for 15-minute increment adjustments
- **DUR-003**: Configurable increment size (15, 30, 60 minutes)
- **DUR-004**: Visual feedback during duration changes
- **DUR-005**: Duration presets for common task types

#### Advanced Keyboard Controls
- **KEY-ADV-001**: Left/Right arrows adjust duration
- **KEY-ADV-002**: Shift+arrows for larger increments
- **KEY-ADV-003**: Number keys for quick duration presets (1-9)

#### Smart Slot Calculation
- **SLOT-ADV-001**: Calculate valid slots based on current duration
- **SLOT-ADV-002**: Support cross-day scheduling for long tasks
- **SLOT-ADV-003**: Working hours boundaries
- **SLOT-ADV-004**: Buffer time between tasks

#### UI Enhancements
- **UI-ADV-001**: Task duration visualization with drag handles
- **UI-ADV-002**: Available slot highlighting based on current duration
- **UI-ADV-003**: Visual time slots in 15-minute increments

## Decisions Made

Based on stakeholder feedback, the following decisions have been made:

1. **Calendar Events**: Read-only integration - tasks set scheduled/deadline times only
2. **Authentication**: Hardcoded personal calendar for MVP (no OAuth initially)
3. **Calendar Visibility**: Toggle calendars on/off with local storage persistence
4. **Time Grid**: 15-minute increments for positioning, 30-minute task blocks
5. **Keyboard Navigation**: Navigate at 15-min increments, skip positions without 30-min clearance
6. **Confirmation Flow**: Show task preview first, then confirm with second action
7. **Event Display**: Side-by-side by default, overlap only when space-constrained
8. **Conflict Scheduling**: No warning prompt - just require physical click
9. **Current Day**: Only show future time slots (hide past times)
10. **Overlay Integration**: Use existing schedule/deadline overlay system
11. **Desktop Priority**: Desktop-first design approach
12. **Working Hours**: Future feature (post-MVP)
13. **Timezone Options**: Future feature (MVP locked to PST)
14. **Clear Function**: Shift+Delete keyboard shortcut plus clear button

## Success Criteria

### Launch Criteria
- [ ] Core scheduling flow works via keyboard only
- [ ] Google Calendar events display correctly
- [ ] No scheduling conflicts possible
- [ ] Performance meets all requirements
- [ ] User testing shows 80%+ task completion rate

### Post-Launch Success
- 75% of users adopt the feature within 2 weeks
- Average scheduling time reduced by 50%
- Support tickets related to scheduling drop by 60%
- Feature retention rate >80% after 30 days

## Appendix

### Keyboard Shortcut Reference (MVP)
- `↑/↓` - Navigate at 15-minute increments (skips positions without 30-min space)
- `←/→` or `Tab/Shift+Tab` - Navigate between days
- `Enter` (first) - Show task preview in selected position
- `Enter` (second) - Confirm and save selection
- `Shift+Delete` - Clear current date selection
- `Esc` - Cancel scheduling
- `d` - Open date picker
- `?` - Show help

### Future Keyboard Shortcuts (Post-MVP)
When duration features are implemented:
- `←/→` - Adjust duration (15 min)
- `Shift+←/→` - Adjust duration (1 hour)
- `1-9` - Quick duration presets
- `Space` - Toggle calendar visibility

### Calendar Display
- All calendars shown in their original Google Calendar colors
- Calendar name visible on hover
- Overlapping events displayed with visual clarity
- Task blocks shown as 30-minute purple blocks