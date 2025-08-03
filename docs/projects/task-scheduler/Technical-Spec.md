# Technical Specification: Task Scheduler Feature

## Overview

This document provides the detailed technical specification for implementing the Task Scheduler feature, which provides a visual calendar-integrated interface for scheduling tasks with 15-minute positioning granularity and 30-minute task blocks.

## System Requirements

### Frontend Requirements
- React 19+ with TypeScript
- Next.js 15 App Router
- Tailwind CSS 4
- Modern browsers supporting CSS Grid and ResizeObserver

### Backend Requirements
- Next.js API Routes
- Google Calendar API v3
- Environment variables for credentials

### Performance Requirements
- Calendar data loads in <500ms
- Slot navigation response <50ms
- 60fps animations during interactions
- Smooth scrolling between time positions

## Data Models

### Core Types

```typescript
// Time slot representation
interface TimeSlot {
  start: Date
  end: Date
  isAvailable: boolean
  hasRequiredClearance: boolean // 30-min clearance for task
  conflictingEvents?: CalendarEvent[]
}

// Calendar event from Google Calendar
interface CalendarEvent {
  id: string
  calendarId: string
  calendarName: string
  title: string
  start: Date
  end: Date
  color: string
  isAllDay: boolean
  location?: string
  attendees?: string[]
}

// Calendar visibility state
interface CalendarVisibilityState {
  [calendarId: string]: boolean // true = visible
}

// Scheduler state
interface SchedulerState {
  currentDate: Date
  selectedPosition: Date | null // 15-min position
  previewMode: boolean // first Enter pressed
  confirmMode: boolean // ready to confirm
  calendarEvents: CalendarEvent[]
  visibleCalendars: Set<string>
  schedulingMode: 'scheduled' | 'deadline'
  isLoading: boolean
  error: string | null
}
```

## Component Architecture

### 1. TaskSchedulerOverlay

Replaces existing DatePickerOverlay for schedule/deadline selection.

```typescript
interface TaskSchedulerOverlayProps {
  mode: 'scheduled' | 'deadline'
  task: TodoistTask
  onSelect: (date: Date) => void
  onClose: () => void
  isVisible: boolean
}
```

**Responsibilities:**
- Manages overlay lifecycle
- Handles keyboard context isolation
- Coordinates child components
- Manages calendar data fetching

### 2. CalendarDayView

Renders the vertical timeline with time marks.

```typescript
interface CalendarDayViewProps {
  date: Date
  events: CalendarEvent[]
  visibleCalendars: Set<string>
  selectedPosition: Date | null
  previewTask: { start: Date; duration: number } | null
  onPositionSelect: (position: Date) => void
  onPositionHover: (position: Date | null) => void
}
```

**Implementation Details:**
- CSS Grid with 96 rows (24 hours × 4 quarters)
- Row height calculated for viewport
- Sticky time labels on left
- Auto-scroll to current time on load
- Hide past times for current day

### 3. TimePositionSlot

Represents a 15-minute position on the timeline.

```typescript
interface TimePositionSlotProps {
  position: Date
  hasClearance: boolean // 30-min space available
  isSelected: boolean
  isPreview: boolean
  onClick: () => void
  onHover: () => void
}
```

**Visual States:**
- `available`: 30-min clearance, keyboard navigable
- `unavailable`: insufficient clearance, mouse-only
- `selected`: currently selected position
- `preview`: showing 30-min task preview
- `confirming`: ready to confirm (pulsing)

### 4. CalendarEventRenderer

Handles the complex layout of overlapping events.

```typescript
interface CalendarEventRendererProps {
  events: CalendarEvent[]
  containerWidth: number
  timeRange: { start: Date; end: Date }
  onEventClick?: (event: CalendarEvent) => void
}
```

**Layout Algorithm:**
1. Group overlapping events
2. Calculate columns (prioritize side-by-side)
3. Only overlap when width < 100px per event
4. Maintain original calendar colors
5. Show calendar name on hover

### 5. CalendarVisibilityPanel

Manages which calendars are visible.

```typescript
interface CalendarVisibilityPanelProps {
  calendars: Calendar[]
  visibility: CalendarVisibilityState
  onToggle: (calendarId: string) => void
}
```

**Features:**
- Checkbox list with calendar colors
- Persists to localStorage
- All visible by default
- Immediate update on toggle

## API Design

### Calendar Configuration (MVP)

```typescript
// GET /api/calendar/config
interface CalendarConfigResponse {
  apiKey: string // From environment
  calendarIds: string[] // From environment
  timezone: 'America/Los_Angeles'
}
```

### Fetch Calendar Events

```typescript
// GET /api/calendar/events?date=2024-01-15&days=1
interface CalendarEventsRequest {
  date: string // ISO date
  days: number // Number of days to fetch
}

interface CalendarEventsResponse {
  events: CalendarEvent[]
  calendars: Calendar[]
}
```

### Update Task Schedule

```typescript
// Uses existing task update endpoint
// PUT /api/todoist/tasks/:id
interface ScheduleUpdateRequest {
  due?: { date: string } | null
  deadline?: string | null
}
```

## Keyboard Navigation Logic

### Navigation State Machine

```typescript
class KeyboardNavigationManager {
  private positions: Date[] // All 15-min positions
  private availablePositions: Date[] // Positions with 30-min clearance
  private currentIndex: number
  
  navigateUp(): void {
    // Find previous available position
    const prevIndex = this.findPreviousAvailable(this.currentIndex)
    if (prevIndex !== -1) {
      this.currentIndex = prevIndex
      this.scrollToPosition()
    }
  }
  
  navigateDown(): void {
    // Find next available position
    const nextIndex = this.findNextAvailable(this.currentIndex)
    if (nextIndex !== -1) {
      this.currentIndex = nextIndex
      this.scrollToPosition()
    }
  }
  
  private findNextAvailable(from: number): number {
    // Skip positions without 30-min clearance
    for (let i = from + 1; i < this.availablePositions.length; i++) {
      if (this.hasRequiredClearance(this.positions[i])) {
        return i
      }
    }
    return -1
  }
}
```

### Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| ↑/↓ | Navigate 15-min positions | Available slots only |
| ←/→ | Navigate days | Any time |
| Tab/Shift+Tab | Navigate days (alt) | Any time |
| Enter (1st) | Show task preview | On valid position |
| Enter (2nd) | Confirm selection | Preview visible |
| Escape | Close scheduler | Any time |
| d | Open date picker | Any time |
| Shift+Delete | Clear date | When date set |

## Time Slot Calculation

### Algorithm for Available Positions

```typescript
function calculateAvailablePositions(
  date: Date,
  events: CalendarEvent[],
  taskDuration: number = 30
): TimeSlot[] {
  const positions: TimeSlot[] = []
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  // Generate 15-minute positions
  let current = new Date(dayStart)
  while (current < dayEnd) {
    // Skip past times for today
    if (isToday && current < now) {
      current.setMinutes(current.getMinutes() + 15)
      continue
    }
    
    const taskEnd = new Date(current)
    taskEnd.setMinutes(taskEnd.getMinutes() + taskDuration)
    
    // Check if full task duration fits without conflicts
    const hasConflict = events.some(event => 
      (current < event.end && taskEnd > event.start)
    )
    
    positions.push({
      start: new Date(current),
      end: taskEnd,
      isAvailable: !hasConflict,
      hasRequiredClearance: !hasConflict && taskEnd <= dayEnd
    })
    
    current.setMinutes(current.getMinutes() + 15)
  }
  
  return positions
}
```

## Visual Design Specifications

### Color Palette

```css
/* Time slots */
--slot-available: #eff6ff; /* blue-50 */
--slot-hover: #dbeafe; /* blue-100 */
--slot-selected: #bfdbfe; /* blue-200 */
--slot-preview: #e9d5ff; /* purple-100 */
--slot-confirming: #d8b4fe; /* purple-200 */

/* Calendar events - use original colors */
/* Task blocks */
--task-block: #a855f7; /* purple-500 */
```

### Grid Layout

```css
.calendar-grid {
  display: grid;
  grid-template-columns: 60px 1fr; /* Time labels + content */
  grid-template-rows: repeat(96, minmax(15px, 1fr)); /* 15-min slots */
  height: 100%;
  overflow-y: auto;
}

.time-label {
  grid-column: 1;
  position: sticky;
  left: 0;
  background: white;
  border-right: 1px solid #e5e7eb;
}

.event-container {
  grid-column: 2;
  position: relative;
  min-height: 0; /* Allow events to shrink */
}
```

### Event Layout CSS

```css
.calendar-event {
  position: absolute;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.calendar-event:hover {
  transform: scale(1.02);
  z-index: 10;
}

/* Side-by-side layout */
.event-column {
  position: absolute;
  top: 0;
  bottom: 0;
}

/* Overlap only when necessary */
.event-overlapped {
  opacity: 0.95;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
```

## Implementation Guidelines

### 1. Progressive Enhancement
- Start with basic grid and navigation
- Add calendar integration incrementally
- Polish animations and transitions last

### 2. Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation fully supported
- Screen reader announcements for state changes
- High contrast mode support

### 3. Performance Optimization
- Virtualize long time ranges
- Debounce position calculations
- Cache calendar data aggressively
- Use React.memo for slot components

### 4. Error Handling
- Graceful fallback for calendar API failures
- Clear error messages with retry options
- Offline mode with cached data
- Timeout handling for slow requests

### 5. Testing Strategy
- Unit tests for time calculations
- Integration tests for keyboard navigation
- E2E tests for full scheduling flow
- Visual regression tests for layout

## Security Considerations

### API Security
- Environment variables for credentials
- Rate limiting on calendar endpoints
- Input validation for dates
- XSS prevention in event rendering

### Data Privacy
- No calendar data stored permanently
- Local storage only for preferences
- Clear data on logout
- Respect calendar permissions

## Future Enhancements

### Post-MVP Features
1. **Dynamic Duration**
   - Adjust task duration with keyboard
   - Visual feedback during adjustment
   - Smart duration suggestions

2. **Working Hours**
   - Configure daily working hours
   - Visual distinction for work/personal time
   - Respect boundaries in navigation

3. **OAuth Implementation**
   - Proper Google OAuth flow
   - Token refresh handling
   - Multi-account support

4. **Advanced Features**
   - Recurring task patterns
   - Time zone support
   - Calendar event creation
   - Conflict resolution suggestions

## Migration Path

### From Current Implementation
1. Create feature flag for new scheduler
2. Run both implementations in parallel
3. Gradually migrate users
4. Remove old implementation

### Database Changes
- No database changes required
- Uses existing task update APIs
- Backward compatible

## Conclusion

This specification provides a complete technical blueprint for implementing the Task Scheduler feature. The design prioritizes keyboard efficiency, visual clarity, and seamless integration with the existing application while maintaining flexibility for future enhancements.