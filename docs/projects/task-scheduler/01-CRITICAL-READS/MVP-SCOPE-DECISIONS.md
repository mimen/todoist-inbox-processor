# MVP Scope Decisions

## Critical Decisions for Implementation

This document contains the FINAL decisions made for the MVP implementation. These are not suggestions - they are requirements.

## Core Functionality

### Time Grid Structure
- **Grid**: 15-minute increments (96 slots per day)
- **Task Duration**: FIXED 30 minutes (no adjustment)
- **Navigation**: Moves in 15-minute steps
- **Positioning**: Can start at any 15-minute mark

### Keyboard Navigation Rules
```
RULE: Keyboard can ONLY navigate to positions with 30-minute clearance
RULE: Mouse can click ANY position (even with conflicts)
```

### Example Scenarios
1. **Free Hour (10:00-11:00)**
   - Keyboard can select: 10:00, 10:15, 10:30
   - Cannot select: 10:45 (only 15 min before 11:00 event)

2. **Event at 2:00-3:00**
   - Keyboard cannot select: 1:45 (would overlap)
   - Mouse CAN click: 1:45 (user override)

## Calendar Integration

### Authentication
```
MVP: Hardcoded credentials in environment variables
NOT MVP: OAuth flow
```

### Environment Variables Required
```bash
GOOGLE_CALENDAR_API_KEY=your-api-key
GOOGLE_CALENDAR_IDS=calendar1@gmail.com,calendar2@gmail.com
```

### Calendar Display
- Show ALL calendars in original colors
- NO separate lanes (too many calendars)
- Calendar name on hover only
- Side-by-side events (overlap only when necessary)

## User Interaction Flow

### Two-Step Confirmation
1. **First Action** (Enter/Click) → Show task preview
2. **Second Action** (Enter/Click) → Save and close

### Visual States
```
Idle → Selected → Preview → Confirming → Saved
```

### NO Conflict Warnings
- No warning dialogs
- No confirmation prompts for conflicts
- Just the two-step preview/confirm flow

## Feature Boundaries

### IN SCOPE for MVP
- ✅ Single day view
- ✅ Navigation between days
- ✅ Calendar visibility toggles
- ✅ Local storage for preferences
- ✅ PST timezone only
- ✅ Clear date function (Shift+Delete)
- ✅ Date picker for distant dates ('d' key)

### OUT OF SCOPE for MVP
- ❌ Task duration adjustment
- ❌ OAuth authentication
- ❌ Creating calendar events
- ❌ Recurring tasks
- ❌ Multiple timezones
- ❌ Working hours
- ❌ Week/Month views
- ❌ Mobile optimization

## Technical Constraints

### Performance Requirements
- Calendar load: <500ms
- Slot navigation: <50ms
- Smooth 60fps animations

### Browser Support
- Desktop Chrome/Firefox/Safari only
- No IE11 support
- No mobile optimization

### State Management
- Use existing React Context patterns
- No external state libraries
- Local storage for preferences only

## Implementation Priority

### Phase 1 MUST Complete
1. Replace existing overlays
2. Basic day view grid
3. Keyboard navigation

### Phase 2 MUST Complete
1. Calendar integration (hardcoded)
2. Event display
3. Two-step confirmation

### Phase 3 IF Time Permits
1. Visual polish
2. Performance optimization
3. Additional keyboard shortcuts

## Success Metrics

The implementation is successful when:
1. Old date pickers are completely replaced
2. Keyboard navigation works as specified
3. Calendar events display correctly
4. No regressions in existing functionality

## Non-Negotiable Requirements

1. **Must use existing overlay system**
2. **Must maintain current keyboard shortcuts**
3. **Must work with current task update APIs**
4. **Must not break existing functionality**
5. **Must follow current UI patterns**

## Common Misunderstandings

### "Available Slot" Definition
- For keyboard: Position where full 30-min task fits
- For mouse: Any 15-minute position

### "Conflict" Handling
- Keyboard: Skip conflicting positions
- Mouse: Allow selection anywhere
- Display: Show task overlapping event

### "Calendar Integration"
- MVP: Read-only display
- NOT MVP: Creating/modifying events

## Final Notes

If something isn't explicitly listed as IN SCOPE, assume it's OUT OF SCOPE. When in doubt, choose the simpler implementation that meets the core requirements.