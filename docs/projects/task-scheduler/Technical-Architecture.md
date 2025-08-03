# Technical Architecture: Task Scheduler Feature

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Component Design](#component-design)
4. [Google Calendar API Integration](#google-calendar-api-integration)
5. [State Management Architecture](#state-management-architecture)
6. [Keyboard and Mouse Interaction Handling](#keyboard-and-mouse-interaction-handling)
7. [Time Slot Calculation Engine](#time-slot-calculation-engine)
8. [Visual Rendering Strategy](#visual-rendering-strategy)
9. [Integration Points](#integration-points)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Technical Constraints and Considerations](#technical-constraints-and-considerations)
12. [Security and Performance](#security-and-performance)
13. [Deployment Architecture](#deployment-architecture)

## Executive Summary

The Task Scheduler feature introduces a calendar-integrated scheduling interface for the todoist-inbox-processor application. This architecture leverages the existing overlay pattern, integrates with Google Calendar API for read-only access, and provides intelligent time slot management with keyboard-first navigation. The system is designed to be performant, maintainable, and seamlessly integrated with the existing task processing workflow.

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    todoist-inbox-processor                   │
│                                                              │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │   TaskProcessor     │    │   TaskSchedulerOverlay    │  │
│  │  (Main Component)   │───▶│  (Scheduling Interface)   │  │
│  └─────────────────────┘    └───────────────────────────┘  │
│                                         │                    │
│                                         ▼                    │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │  Google Calendar    │◀───│   CalendarDataProvider   │  │
│  │       API           │    │   (Service Layer)        │  │
│  └─────────────────────┘    └───────────────────────────┘  │
│                                         │                    │
│                                         ▼                    │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │   Todoist API       │◀───│   TimeSlotCalculator     │  │
│  │  (Task Updates)     │    │   (Business Logic)       │  │
│  └─────────────────────┘    └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and external integrations
2. **Overlay Pattern**: Reuses existing schedule/deadline overlay components
3. **Isolated Context**: Keyboard shortcuts scoped to scheduler context only
4. **Read-Only Calendar**: No modifications to Google Calendar events
5. **Performance First**: Optimized rendering and calculation strategies
6. **Type Safety**: Full TypeScript coverage with strict typing

## Component Design

### Core Components

#### 1. TaskSchedulerOverlay
Primary container component managing the scheduling interface.

```typescript
interface TaskSchedulerOverlayProps {
  task: TodoistTask
  isVisible: boolean
  onSchedule: (scheduledTime: Date) => Promise<void>
  onClose: () => void
  mode: 'scheduled' | 'deadline'
}

interface TaskSchedulerOverlayState {
  currentDate: Date
  selectedSlot: TimeSlot | null
  calendarEvents: CalendarEvent[]
  availableSlots: TimeSlot[]
  loading: boolean
  error: string | null
}
```

#### 2. CalendarDayView
Renders the day view with time grid and events.

```typescript
interface CalendarDayViewProps {
  date: Date
  events: CalendarEvent[]
  selectedSlot: TimeSlot | null
  availableSlots: TimeSlot[]
  onSlotSelect: (slot: TimeSlot) => void
  onSlotHover: (slot: TimeSlot | null) => void
}
```

#### 3. TimeSlotGrid
Manages the visual time slot grid and interactions.

```typescript
interface TimeSlotGridProps {
  startHour: number // 0-23
  endHour: number   // 0-23
  slotDuration: number // minutes (30 for MVP)
  selectedSlot: TimeSlot | null
  availableSlots: TimeSlot[]
  onSlotClick: (time: Date) => void
}
```

#### 4. CalendarEventRenderer
Handles visual rendering of calendar events with overlap management.

```typescript
interface CalendarEventRendererProps {
  events: CalendarEvent[]
  containerWidth: number
  slotHeight: number
  onEventHover: (event: CalendarEvent | null) => void
}
```

#### 5. KeyboardNavigationProvider
Manages keyboard shortcuts within scheduler context.

```typescript
interface KeyboardNavigationProviderProps {
  availableSlots: TimeSlot[]
  currentSlot: TimeSlot | null
  onSlotSelect: (slot: TimeSlot) => void
  onDateChange: (direction: -1 | 1) => void
  onCancel: () => void
  children: React.ReactNode
}
```

### Component Hierarchy

```
TaskSchedulerOverlay
├── KeyboardNavigationProvider
├── SchedulerHeader
│   ├── DateNavigator
│   └── QuickDatePicker
├── CalendarDayView
│   ├── TimeLabels
│   ├── TimeSlotGrid
│   ├── CalendarEventRenderer
│   └── TaskPreview
└── SchedulerFooter
    └── ActionButtons
```

## Google Calendar API Integration

### Authentication Architecture

#### MVP Approach: Hardcoded Credentials

For MVP, we'll use a hardcoded service account or API key to access a specific Google Calendar account:

```typescript
interface GoogleCalendarService {
  // MVP: Direct API access with hardcoded credentials
  fetchEvents(dateRange: DateRange): Promise<CalendarEvent[]>
  listCalendars(): Promise<Calendar[]>
}

// Future: OAuth implementation
interface GoogleAuthService {
  authenticate(): Promise<GoogleAuthToken>
  refreshToken(token: GoogleAuthToken): Promise<GoogleAuthToken>
  revokeAccess(): Promise<void>
}

interface GoogleAuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string[]
}
```

### Calendar Data Service

```typescript
class CalendarDataProvider {
  private cache: CalendarCache
  private rateLimiter: RateLimiter
  
  async fetchEvents(params: {
    calendarIds: string[]
    timeMin: Date
    timeMax: Date
  }): Promise<CalendarEvent[]>
  
  async listCalendars(): Promise<Calendar[]>
  
  private handleRateLimit(): Promise<void>
  private cacheEvents(events: CalendarEvent[]): void
}
```

### API Integration Flow

```
1. Initial Load:
   Client → Next.js API Route → Google Calendar API
   
2. MVP Flow:
   /api/calendar/events → Use hardcoded credentials → Fetch events → Transform
   
3. Future OAuth Flow:
   /api/auth/google/login → Google OAuth → Callback → Store tokens
   
3. Event Fetching:
   /api/calendar/events → Validate token → Fetch events → Transform → Cache
```

### Data Models

```typescript
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

interface Calendar {
  id: string
  name: string
  color: string
  isPrimary: boolean
  accessRole: 'owner' | 'writer' | 'reader'
}

// Calendar visibility stored in localStorage
interface CalendarVisibilityState {
  [calendarId: string]: boolean
}
```

## State Management Architecture

### Scheduler State Structure

```typescript
interface SchedulerState {
  // View State
  currentDate: Date
  viewRange: { start: Date; end: Date }
  
  // Selection State
  selectedSlot: TimeSlot | null
  hoveredSlot: TimeSlot | null
  
  // Calendar Data
  calendars: Calendar[]
  events: CalendarEvent[]
  eventLoadingState: LoadingState
  
  // Slot Calculation
  availableSlots: TimeSlot[]
  slotDuration: number // 30 minutes for MVP
  slotIncrement: number // 15 minutes for positioning
  visibleCalendars: Set<string> // Calendar visibility state
  
  // UI State
  isDatePickerOpen: boolean
  keyboardNavigationEnabled: boolean
  
  // Task Context
  taskId: string
  taskContent: string
  schedulingMode: 'scheduled' | 'deadline'
}
```

### State Management Approach

Using React hooks with Context API for scheduler-specific state:

```typescript
const SchedulerContext = createContext<{
  state: SchedulerState
  actions: SchedulerActions
}>()

const useScheduler = () => {
  const context = useContext(SchedulerContext)
  if (!context) throw new Error('useScheduler must be used within SchedulerProvider')
  return context
}
```

### Action Handlers

```typescript
interface SchedulerActions {
  // Navigation
  navigateToDate(date: Date): void
  navigateByDays(days: number): void
  
  // Selection
  selectSlot(slot: TimeSlot): void
  hoverSlot(slot: TimeSlot | null): void
  
  // Scheduling
  confirmSchedule(): Promise<void>
  cancelSchedule(): void
  
  // Calendar
  refreshCalendarEvents(): Promise<void>
  toggleCalendarVisibility(calendarId: string): void
  saveCalendarVisibility(): void
  clearSelection(): void
}
```

## Keyboard and Mouse Interaction Handling

### Keyboard Navigation System

```typescript
class KeyboardNavigationManager {
  private availableSlots: TimeSlot[]
  private currentIndex: number
  private enabled: boolean
  
  constructor(private options: {
    onSlotSelect: (slot: TimeSlot) => void
    onDateChange: (days: number) => void
    onConfirm: () => void
    onCancel: () => void
  })
  
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return
    
    switch(event.key) {
      case 'ArrowUp':
        this.navigateToPreviousSlot()
        break
      case 'ArrowDown':
        this.navigateToNextSlot()
        break
      case 'ArrowLeft':
      case 'Shift+Tab':
        this.navigateToPreviousDay()
        break
      case 'ArrowRight':
      case 'Tab':
        this.navigateToNextDay()
        break
      case 'Enter':
        this.confirmSelection()
        break
      case 'Escape':
        this.cancelScheduling()
        break
    }
  }
  
  private navigateToNextSlot(): void {
    // Skip occupied slots
    const nextIndex = this.findNextAvailableSlot(this.currentIndex + 1)
    if (nextIndex !== -1) {
      this.currentIndex = nextIndex
      this.options.onSlotSelect(this.availableSlots[nextIndex])
    }
  }
}
```

### Mouse Interaction Handler

```typescript
class MouseInteractionHandler {
  constructor(private options: {
    onSlotClick: (time: Date) => void
    onEventClick: (event: CalendarEvent) => void
    onEmptyClick: () => void
  })
  
  handleSlotClick(event: React.MouseEvent, time: Date): void {
    event.stopPropagation()
    
    // Allow clicking on any slot, including occupied ones
    this.options.onSlotClick(time)
  }
  
  handleEventClick(event: React.MouseEvent, calendarEvent: CalendarEvent): void {
    event.stopPropagation()
    
    // Allow direct click on occupied slots without warning
    const clickTime = this.pixelsToTime(event.clientY)
    this.options.onTimeClick(clickTime, calendarEvent)
  }
}
```

### Context Isolation Strategy

```typescript
// Disable main app keyboard shortcuts when scheduler is open
useEffect(() => {
  if (isSchedulerVisible) {
    mainAppKeyboardContext.disable()
    schedulerKeyboardContext.enable()
    
    return () => {
      schedulerKeyboardContext.disable()
      mainAppKeyboardContext.enable()
    }
  }
}, [isSchedulerVisible])
```

## Time Slot Calculation Engine

### Core Algorithm

```typescript
class TimeSlotCalculator {
  private readonly SLOT_DURATION = 30 // minutes for MVP
  private readonly SLOT_INCREMENT = 15 // minutes for positioning
  private readonly TIMEZONE = 'America/Los_Angeles'
  
  calculateAvailableSlots(params: {
    date: Date
    events: CalendarEvent[]
    currentTime?: Date
    workingHours?: { start: number; end: number }
  }): TimeSlot[] {
    const { date, events, currentTime = new Date(), workingHours = { start: 0, end: 24 } } = params
    
    // Generate all possible positions at 15-minute increments
    const allPositions = this.generateDayPositions(date, workingHours)
    
    // Filter out past positions for current day
    let validPositions = allPositions
    if (this.isSameDay(date, currentTime)) {
      validPositions = allPositions.filter(pos => pos.start > currentTime)
    }
    
    // Filter positions that have 30-minute clearance
    const availableSlots = validPositions.filter(position => 
      this.hasRequiredClearance(position, events, this.SLOT_DURATION)
    )
    
    return availableSlots
  }
  
  private generateDayPositions(date: Date, hours: { start: number; end: number }): TimeSlot[] {
    const positions: TimeSlot[] = []
    const startTime = new Date(date)
    startTime.setHours(hours.start, 0, 0, 0)
    
    const endTime = new Date(date)
    endTime.setHours(hours.end, 0, 0, 0)
    
    let currentTime = new Date(startTime)
    
    // Generate positions at 15-minute increments
    while (currentTime <= endTime - this.SLOT_DURATION * 60000) {
      positions.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + this.SLOT_DURATION * 60 * 1000),
        isAvailable: true
      })
      
      currentTime.setMinutes(currentTime.getMinutes() + this.SLOT_INCREMENT)
    }
    
    return positions
  }
  
  private hasRequiredClearance(position: TimeSlot, events: CalendarEvent[], durationMinutes: number): boolean {
    const taskEnd = new Date(position.start.getTime() + durationMinutes * 60000)
    
    // Check if the full task duration would overlap with any event
    return !events.some(event => 
      this.hasOverlap(position.start, taskEnd, event.start, event.end)
    )
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString()
  }
  
  private hasOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2
  }
}
```

### Time Slot Data Model

```typescript
interface TimeSlot {
  start: Date
  end: Date
  isAvailable: boolean
  conflictingEvents?: CalendarEvent[]
}

interface SlotCalculationConfig {
  slotDuration: number // 30 minutes for task
  slotIncrement: number // 15 minutes for positioning
  workingHours: {
    start: number // 0-23
    end: number   // 0-23
  }
  bufferTime?: number // minutes between tasks
  timezone: string
}
```

## Visual Rendering Strategy

### Calendar Event Layout Algorithm

```typescript
class EventLayoutEngine {
  calculateEventPositions(events: CalendarEvent[], containerWidth: number): EventPosition[] {
    // Sort events by start time and duration
    const sortedEvents = this.sortEvents(events)
    
    // Group overlapping events
    const eventGroups = this.groupOverlappingEvents(sortedEvents)
    
    // Calculate positions for each group
    return eventGroups.flatMap(group => 
      this.layoutEventGroup(group, containerWidth)
    )
  }
  
  private groupOverlappingEvents(events: CalendarEvent[]): CalendarEvent[][] {
    const groups: CalendarEvent[][] = []
    let currentGroup: CalendarEvent[] = []
    
    events.forEach(event => {
      if (currentGroup.length === 0) {
        currentGroup.push(event)
      } else {
        const overlaps = currentGroup.some(e => 
          this.eventsOverlap(e, event)
        )
        
        if (overlaps) {
          currentGroup.push(event)
        } else {
          groups.push(currentGroup)
          currentGroup = [event]
        }
      }
    })
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }
    
    return groups
  }
  
  private layoutEventGroup(group: CalendarEvent[], containerWidth: number): EventPosition[] {
    // Prioritize side-by-side display, only overlap when necessary
    const maxColumns = Math.min(group.length, Math.floor(containerWidth / 100)) // Min 100px per event
    const columns = this.calculateColumns(group, maxColumns)
    const columnWidth = containerWidth / columns.length
    
    return group.map(event => {
      const columnIndex = this.findEventColumn(event, columns)
      const overlappingCount = this.getOverlappingCount(event, group)
      
      // Only overlap if we exceed max columns
      const useOverlap = overlappingCount > maxColumns
      
      return {
        event,
        left: columnIndex * (useOverlap ? columnWidth * 0.8 : columnWidth),
        width: useOverlap ? columnWidth : columnWidth - 2, // 2px gap
        top: this.timeToPixels(event.start),
        height: this.timeToPixels(event.end) - this.timeToPixels(event.start),
        zIndex: useOverlap ? columnIndex : 0
      }
    })
  }
}
```

### Local Storage Management

```typescript
class CalendarVisibilityManager {
  private readonly STORAGE_KEY = 'scheduler-calendar-visibility'
  
  loadVisibility(): CalendarVisibilityState {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  }
  
  saveVisibility(state: CalendarVisibilityState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state))
  }
  
  toggleCalendar(calendarId: string, currentState: CalendarVisibilityState): CalendarVisibilityState {
    const newState = {
      ...currentState,
      [calendarId]: !currentState[calendarId]
    }
    this.saveVisibility(newState)
    return newState
  }
  
  // Default all calendars to visible
  initializeVisibility(calendars: Calendar[]): CalendarVisibilityState {
    const stored = this.loadVisibility()
    const state: CalendarVisibilityState = {}
    
    calendars.forEach(calendar => {
      state[calendar.id] = stored[calendar.id] ?? true
    })
    
    this.saveVisibility(state)
    return state
  }
}
```

### Visual Component Styling

```typescript
// Tailwind classes and CSS-in-JS for dynamic styling
const timeSlotStyles = {
  available: 'hover:bg-blue-50 cursor-pointer transition-colors',
  occupied: 'bg-gray-100 cursor-not-allowed',
  selected: 'bg-blue-100 ring-2 ring-blue-500',
  preview: 'bg-purple-100 border-2 border-purple-400 animate-pulse',
  hover: 'bg-blue-50'
}

const eventStyles = (color: string, overlapping: boolean) => ({
  backgroundColor: color,
  opacity: overlapping ? 0.9 : 1,
  borderLeft: `4px solid ${darkenColor(color, 20)}`,
  zIndex: overlapping ? 10 : 1
})
```

### Responsive Design Considerations

```typescript
const breakpoints = {
  tablet: '768px',
  desktop: '1024px'
}

const responsiveStyles = {
  container: {
    base: 'w-full max-w-4xl mx-auto',
    tablet: 'md:max-w-5xl',
    desktop: 'lg:max-w-6xl'
  },
  timeGrid: {
    base: 'grid grid-cols-[80px_1fr]',
    tablet: 'md:grid-cols-[100px_1fr]'
  }
}
```

## Integration Points

### 1. Task Processor Integration

```typescript
// In TaskProcessor component
const handleScheduleTask = useCallback((task: TodoistTask) => {
  setCurrentSchedulingTask(task)
  setShowSchedulerOverlay(true)
  
  // Disable main keyboard context
  mainKeyboardContext.disable()
}, [])

const handleScheduleComplete = useCallback(async (scheduledTime: Date) => {
  try {
    await updateTask(currentSchedulingTask.id, {
      due: {
        date: formatDate(scheduledTime),
        timezone: 'America/Los_Angeles'
      }
    })
    
    setShowSchedulerOverlay(false)
    mainKeyboardContext.enable()
    
    // Show success toast
    showToast({
      message: 'Task scheduled successfully',
      type: 'success'
    })
  } catch (error) {
    handleError(error)
  }
}, [currentSchedulingTask])
```

### 2. API Route Structure

```typescript
// /api/calendar/auth/route.ts
export async function GET() {
  // Initiate OAuth flow
}

// /api/calendar/callback/route.ts
export async function GET(request: Request) {
  // Handle OAuth callback
}

// /api/calendar/events/route.ts
export async function GET(request: Request) {
  // Fetch calendar events
}

// /api/calendar/calendars/route.ts
export async function GET() {
  // List user's calendars
}
```

### 3. Todoist API Integration

```typescript
interface TodoistScheduleUpdate {
  taskId: string
  scheduleType: 'due' | 'scheduled'
  dateTime: Date
  timezone: string
}

async function updateTaskSchedule(update: TodoistScheduleUpdate): Promise<void> {
  const { taskId, scheduleType, dateTime, timezone } = update
  
  const updatePayload = scheduleType === 'due' 
    ? { due: { date: formatDate(dateTime), timezone } }
    : { scheduled: { date: formatDate(dateTime), timezone } }
  
  await todoistApi.updateTask(taskId, updatePayload)
}
```

## Data Flow Diagrams

### 1. Initial Load Flow

```
User Opens Scheduler
        │
        ▼
┌─────────────────┐
│ TaskProcessor   │
│ (opens overlay) │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐     ┌──────────────────┐
│ TaskSchedulerOverlay│────▶│ CalendarProvider │
│   (initializes)     │     │ (fetch calendars)│
└─────────────────────┘     └────────┬─────────┘
         │                           │
         │                           ▼
         │                  ┌──────────────────┐
         │                  │ Google Calendar  │
         │                  │      API         │
         │                  └────────┬─────────┘
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌──────────────────┐
│  TimeSlotCalculator │◀────│  Calendar Events │
│  (compute slots)    │     │   (returned)     │
└────────┬────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────────┐
│   Render Day View   │
│  (display to user)  │
└─────────────────────┘
```

### 2. Slot Selection Flow

```
User Interaction (Keyboard/Mouse)
              │
              ▼
┌───────────────────────────┐
│ Interaction Handler       │
│ (validate selection)      │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐
│ State Update              │
│ (selectedSlot)            │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐
│ Visual Feedback           │
│ (highlight slot)          │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐
│ Confirm Action            │
│ (Enter/Click)             │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐     ┌──────────────────┐
│ Update Task               │────▶│ Todoist API      │
│ (set scheduled/deadline)  │     │ (persist change) │
└───────────────────────────┘     └──────────────────┘
```

### 3. Calendar Sync Flow

```
┌─────────────────┐
│ Component Mount │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Check Auth Status       │
└────────┬────────────────┘
         │
         ├─── Not Authenticated ──▶ OAuth Flow
         │
         ▼
┌─────────────────────────┐
│ Load Cached Events      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐     ┌──────────────────┐
│ Fetch Fresh Events      │────▶│ Google Calendar  │
│ (background)            │     │      API         │
└────────┬────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Merge & Deduplicate     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Update UI               │
└─────────────────────────┘
```

## Technical Constraints and Considerations

### 1. Performance Constraints

- **Calendar Event Limit**: Maximum 250 events per day view
- **Render Performance**: 60fps target for all interactions
- **API Rate Limits**: Google Calendar API quota management
- **Memory Usage**: Efficient event data structures for large datasets

### 2. Browser Compatibility

- **Target Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required APIs**: Web Crypto API for OAuth, ResizeObserver for responsive layout
- **Fallbacks**: Graceful degradation for older browsers

### 3. Timezone Handling

```typescript
// All times normalized to PST for MVP
const PST_TIMEZONE = 'America/Los_Angeles'

function normalizeToST(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: PST_TIMEZONE }))
}

function formatForTodoist(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}
```

### 4. Error Handling Strategy

```typescript
class SchedulerErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    logError('SchedulerError', { error, errorInfo })
  }
  
  render() {
    if (this.state.hasError) {
      return <SchedulerErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
```

### 5. Accessibility Requirements

- **ARIA Labels**: Complete labeling for screen readers
- **Keyboard Navigation**: Full functionality without mouse
- **Focus Management**: Proper focus trapping in overlay
- **Announcements**: Live regions for state changes

```typescript
<div
  role="dialog"
  aria-label="Task Scheduler"
  aria-describedby="scheduler-instructions"
  tabIndex={-1}
  ref={focusTrapRef}
>
  <div id="scheduler-instructions" className="sr-only">
    Use arrow keys to navigate time slots. Press Enter to select.
  </div>
  {/* Scheduler content */}
</div>
```

## Security and Performance

### Security Considerations

1. **OAuth Token Storage**
   ```typescript
   // Encrypted storage in HTTP-only cookies
   interface SecureTokenStorage {
     store(token: GoogleAuthToken): Promise<void>
     retrieve(): Promise<GoogleAuthToken | null>
     revoke(): Promise<void>
   }
   ```

2. **API Key Protection**
   - Client ID only exposed to client
   - Client secret stored in environment variables
   - Token refresh handled server-side

3. **Content Security Policy**
   ```typescript
   const cspHeaders = {
     'Content-Security-Policy': 
       "default-src 'self'; " +
       "connect-src 'self' https://www.googleapis.com; " +
       "script-src 'self' 'unsafe-inline' https://apis.google.com;"
   }
   ```

### Performance Optimizations

1. **Virtual Scrolling for Long Event Lists**
   ```typescript
   import { VariableSizeList } from 'react-window'
   
   const VirtualizedEventList = ({ events, height }) => (
     <VariableSizeList
       height={height}
       itemCount={events.length}
       itemSize={getEventHeight}
       width="100%"
     >
       {EventRow}
     </VariableSizeList>
   )
   ```

2. **Memoization Strategy**
   ```typescript
   const memoizedSlotCalculation = useMemo(
     () => calculateAvailableSlots(date, events, config),
     [date, events, config]
   )
   
   const MemoizedEventRenderer = React.memo(
     CalendarEventRenderer,
     (prevProps, nextProps) => {
       return (
         prevProps.events === nextProps.events &&
         prevProps.containerWidth === nextProps.containerWidth
       )
     }
   )
   ```

3. **Debounced Updates**
   ```typescript
   const debouncedDateChange = useMemo(
     () => debounce((newDate: Date) => {
       setCurrentDate(newDate)
       fetchEventsForDate(newDate)
     }, 300),
     []
   )
   ```

### Caching Strategy

```typescript
interface CacheStrategy {
  // LRU cache for calendar events
  eventCache: LRUCache<string, CalendarEvent[]>
  
  // Session-based calendar list cache
  calendarCache: Map<string, Calendar[]>
  
  // Prefetch adjacent days
  prefetchDays: number // 3 days before and after
}

const cacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
  prefetchOnIdle: true
}
```

## Deployment Architecture

### Environment Configuration

```typescript
// Development
const devConfig = {
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_DEV,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET_DEV,
  OAUTH_REDIRECT_URI: 'http://localhost:3000/api/calendar/callback'
}

// Production
const prodConfig = {
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  OAUTH_REDIRECT_URI: 'https://app.example.com/api/calendar/callback'
}
```

### Feature Flags

```typescript
interface FeatureFlags {
  taskScheduler: boolean
  calendarIntegration: boolean
  multiDayView: boolean
  customDuration: boolean // Post-MVP
}

const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const flags = useContext(FeatureFlagContext)
  return flags[flag] ?? false
}
```

### Monitoring and Analytics

```typescript
// Performance monitoring
const trackSchedulerMetrics = {
  loadTime: (duration: number) => {
    analytics.track('scheduler_load_time', { duration })
  },
  
  slotSelection: (method: 'keyboard' | 'mouse') => {
    analytics.track('scheduler_slot_selected', { method })
  },
  
  taskScheduled: (data: { duration: number; daysAhead: number }) => {
    analytics.track('task_scheduled', data)
  }
}

// Error tracking
const errorReporting = {
  calendarFetchError: (error: Error) => {
    Sentry.captureException(error, {
      tags: { component: 'scheduler', operation: 'calendar_fetch' }
    })
  }
}
```

### Rollout Strategy

1. **Phase 1**: Feature flag enabled for internal testing
2. **Phase 2**: 10% rollout to power users
3. **Phase 3**: 50% rollout with A/B testing
4. **Phase 4**: 100% rollout with legacy fallback
5. **Phase 5**: Remove legacy scheduling UI

## Appendix

### Type Definitions

```typescript
// Complete type definitions for the scheduler
interface SchedulerTypes {
  // Time-related types
  TimeSlot: {
    start: Date
    end: Date
    isAvailable: boolean
    conflictingEvents?: CalendarEvent[]
  }
  
  // Calendar types
  CalendarEvent: {
    id: string
    calendarId: string
    calendarName: string
    title: string
    start: Date
    end: Date
    color: string
    isAllDay: boolean
    location?: string
    attendees?: Attendee[]
  }
  
  // UI state types
  SchedulerUIState: {
    isLoading: boolean
    error: Error | null
    selectedDate: Date
    viewMode: 'day' | 'week' | 'month'
    showDatePicker: boolean
  }
}
```

### API Response Schemas

```typescript
// Google Calendar API response transformation
const transformGoogleEvent = (googleEvent: any): CalendarEvent => ({
  id: googleEvent.id,
  calendarId: googleEvent.calendarId,
  title: googleEvent.summary || 'Untitled',
  start: new Date(googleEvent.start.dateTime || googleEvent.start.date),
  end: new Date(googleEvent.end.dateTime || googleEvent.end.date),
  color: googleEvent.colorId || '#4285f4',
  isAllDay: !googleEvent.start.dateTime,
  location: googleEvent.location,
  attendees: googleEvent.attendees?.map(a => ({
    email: a.email,
    displayName: a.displayName,
    responseStatus: a.responseStatus
  }))
})
```

### Configuration Options

```typescript
const SCHEDULER_CONFIG = {
  // Time slot configuration
  slots: {
    duration: 30, // minutes
    minTime: '00:00',
    maxTime: '24:00',
    snapToSlot: true
  },
  
  // Visual configuration
  ui: {
    eventOpacity: 0.9,
    slotHeight: 48, // pixels
    timeColumnWidth: 80, // pixels
    maxEventsPerSlot: 3
  },
  
  // Behavior configuration
  behavior: {
    allowPastScheduling: false,
    requireConfirmation: true,
    autoSaveDelay: 1000 // milliseconds
  }
}
```