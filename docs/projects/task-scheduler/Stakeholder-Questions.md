# Stakeholder Questions and Decisions

This document captures the questions raised during requirements gathering and the decisions made.

## Initial Questions and Responses

### 1. User Workflow and Pain Points
**Questions Asked:**
- What specific issues are you experiencing with the current scheduler?
- How do you currently decide when to schedule a task?
- What's your typical workflow when scheduling multiple tasks?

**Decision:** Focus on calendar context visibility as the primary pain point.

### 2. Google Calendar Integration
**Questions Asked:**
- Should the integration be read-only or read/write?
- Which calendars should be displayed?
- Should calendar events block time slots?
- Do you need to see calendar event details?

**Responses:**
- Read-only integration for MVP
- Display all calendars in their original colors
- No separate lanes needed - too many calendars
- Show calendar source on hover
- Rely on Todoist's existing calendar integration for event creation

### 3. Duration Management
**Questions Asked:**
- How should default durations be determined?
- What's the typical range of task durations?
- Should the system learn from actual vs. estimated?

**Response:** Todoist doesn't support task duration currently. Use fixed 30-minute blocks (Todoist default) for MVP. Keep all duration planning documented for future phases.

### 4. Conflict Handling
**Questions Asked:**
- How should the system handle overlapping tasks and calendar events?
- Should it prevent scheduling conflicts or just warn?

**Responses:**
- Keyboard navigation only shows available slots
- Mouse clicks can override and schedule over events
- Visual clarity needed for overlapping events

### 5. Mobile/Responsive Requirements
**Questions Asked:**
- Do you primarily use desktop, mobile, or both?
- Should the mobile experience be identical or simplified?

**Response:** Not explicitly addressed - assumed desktop-first for MVP.

### 6. Additional Features
**Questions Asked:**
- Recurring tasks support?
- Time zone handling?
- Integration with other calendar providers?

**Responses:**
- No recurring tasks for MVP
- Lock to PST timezone
- Google Calendar only

## Key Decisions Summary

1. **MVP Scope**: Fixed 30-minute slots, no duration adjustment
2. **Calendar Display**: All calendars in original colors, no lanes
3. **Navigation**: Keyboard for available slots, mouse can override
4. **Integration**: Read-only Google Calendar
5. **Future Phase**: All duration features documented for later implementation
6. **Date Selection**: Optional date picker for far-future scheduling

## Recent Updates

Based on additional stakeholder feedback:

### Calendar Management
- Calendar visibility toggles with checkboxes
- Settings persist in local storage
- All calendars visible by default

### Technical Approach
- MVP uses hardcoded Google Calendar credentials (no OAuth initially)
- Investigate quick implementation approach similar to Todoist API integration

### Navigation Updates
- Keyboard navigation in 15-minute increments (not 30)
- Tasks remain 30 minutes long
- Available positions must have full 30-minute clearance

### Confirmation Flow
- First Enter/click shows task preview
- Second Enter/click confirms and saves
- No warning prompts for conflicts

### Visual Updates
- Events display side-by-side by default
- Only overlap when screen space insufficient
- Use existing overlay system (replace schedule/deadline overlays)

### Time Display
- Only show future slots for current day
- Hide past time slots automatically

## Confirmed Decisions

- Working hours: Post-MVP feature
- Desktop-first design confirmed
- Timezone options: Future feature (PST only for MVP)
- Clear function: Shift+Delete shortcut plus button