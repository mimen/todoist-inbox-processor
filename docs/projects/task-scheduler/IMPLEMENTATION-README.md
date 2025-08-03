# Task Scheduler Implementation Guide

## Quick Start for LLMs

This guide provides a structured approach to implementing the Task Scheduler feature. Read this document first to understand the implementation approach and order of tasks.

## Implementation Overview

The Task Scheduler is a calendar-integrated scheduling interface that replaces the existing date picker overlays. It provides:
- Visual day view with 15-minute time positioning
- Google Calendar integration (hardcoded for MVP)
- Keyboard navigation through available time slots
- Two-step confirmation flow
- Calendar visibility management

## Implementation Order

### Phase 1: Core UI Setup (Start Here)
1. **Read Critical Documents First**
   - `01-CRITICAL-READS/CRITICAL-UI-REUSE.md` - MUST READ for UI patterns
   - `01-CRITICAL-READS/MVP-SCOPE-DECISIONS.md` - Key decisions and constraints

2. **Review Planning Documents**
   - `02-PLANNING/PRD.md` - Product requirements
   - `02-PLANNING/IMPLEMENTATION_PLAN.md` - Phased approach

3. **Start with Task TS-003**
   - Replace existing overlay system
   - This is the integration point
   - See `03-TASKS/Task-Breakdown.md` for details

### Phase 2: Build Calendar View
1. **Tasks TS-001 and TS-002**
   - Create the day view grid
   - Implement time slot components
   - Use templates from `05-CODE-TEMPLATES/Component-Templates.md`

2. **Task TS-004**
   - Day navigation controls
   - Date picker integration

### Phase 3: Calendar Integration
1. **Task TS-008**
   - Set up hardcoded calendar access
   - See `01-CRITICAL-READS/HARDCODED-AUTH-GUIDE.md`

2. **Tasks TS-009 and TS-010**
   - Calendar service with caching
   - Event display logic

### Phase 4: Interaction Logic
1. **Task TS-005**
   - 15-minute keyboard navigation
   - Skip positions without clearance

2. **Tasks TS-006 and TS-007**
   - Integrate with existing shortcuts
   - Two-step confirmation flow

## Key Implementation Notes

### Critical Constraints
- **15-minute positioning**: Navigation moves in 15-min increments
- **30-minute tasks**: All tasks are fixed 30-minute blocks
- **Keyboard-only for available slots**: Mouse can click anywhere
- **No OAuth for MVP**: Use hardcoded credentials
- **PST timezone only**: No timezone conversion
- **Desktop-first**: Optimize for desktop experience

### Reuse Existing Components
- Use existing overlay infrastructure from `DatePickerOverlay`
- Maintain same props interface for backward compatibility
- Reuse keyboard context isolation patterns
- Follow existing styling patterns

### Testing Approach
1. Start with mock calendar data
2. Test keyboard navigation thoroughly
3. Verify two-step confirmation flow
4. Test calendar visibility persistence
5. Ensure past times are hidden for current day

## Common Pitfalls to Avoid

1. **Don't create new overlay system** - Reuse existing
2. **Don't implement OAuth** - Hardcode for MVP
3. **Don't add duration features** - Fixed 30-min only
4. **Don't create calendar events** - Read-only integration
5. **Don't support recurring tasks** - Not in MVP scope

## File Structure Guide

```
task-scheduler/
├── 01-CRITICAL-READS/        # Read these first!
├── 02-PLANNING/              # Requirements and plans
├── 03-TASKS/                 # Detailed task breakdown
├── 04-SPECIFICATIONS/        # Technical details
├── 05-CODE-TEMPLATES/        # Reusable code
└── IMPLEMENTATION-README.md  # This file
```

## Success Criteria

You'll know the implementation is successful when:
1. 's' and 'd' keys open the new scheduler (not old date picker)
2. Keyboard navigation only stops at positions with 30-min clearance
3. Calendar events display side-by-side when possible
4. Calendar visibility preferences persist across sessions
5. Two Enter presses required to confirm selection
6. Past time slots hidden for current day

## Getting Help

- Check `01-CRITICAL-READS/` for essential context
- Review `05-CODE-TEMPLATES/` for implementation patterns
- See `04-SPECIFICATIONS/Technical-Spec.md` for detailed architecture
- Reference `02-PLANNING/Stakeholder-Questions.md` for decisions made

Start with Phase 1 and work through sequentially. Each phase builds on the previous one.