# User Stories: Task Scheduler Feature

## Epic: Visual Task Scheduling with Calendar Context

### Story 1: Opening the Task Scheduler
**As a** user processing tasks  
**I want to** open a scheduler overlay when setting dates  
**So that** I can see my calendar context before scheduling

#### Acceptance Criteria:
- [ ] Scheduler opens when clicking schedule button or using keyboard shortcut
- [ ] Overlay appears over current interface without losing context
- [ ] Current task information is displayed in the scheduler
- [ ] Escape key closes the scheduler without changes
- [ ] Opening animation is smooth and non-jarring

#### Scenarios:
1. User presses 's' on a task → scheduler opens with today's view
2. User clicks schedule button → scheduler opens with task's current date (if any)
3. User presses Escape → scheduler closes, task remains unchanged

---

### Story 2: Viewing Calendar Events
**As a** user with multiple calendars  
**I want to** see all my Google Calendar events in one view  
**So that** I understand my availability at a glance

#### Acceptance Criteria:
- [ ] All connected Google calendars display simultaneously
- [ ] Events show in their original calendar colors
- [ ] Hovering shows calendar name and event title
- [ ] Overlapping events are visually distinct
- [ ] All-day events appear at the top of the day view

#### Scenarios:
1. User has 3 calendars → all events visible in respective colors
2. Two events overlap → both are visible with slight offset
3. User hovers over event → tooltip shows "Work Calendar: Team Meeting"

---

### Story 3: Keyboard Navigation Through Available Slots
**As a** keyboard-first user  
**I want to** navigate through available time slots with arrow keys  
**So that** I can quickly find an open time without using the mouse

#### Acceptance Criteria:
- [ ] Up/Down arrows move in 15-minute increments
- [ ] Navigation skips positions without 30-minute clearance
- [ ] Current position is clearly highlighted
- [ ] Visual feedback shows 30-minute task block at position
- [ ] Navigation stops at last available position of day

#### Scenarios:
1. User presses ↓ → selection moves down 15 minutes if space available
2. Only 15 minutes until next event → pressing ↓ skips to next valid position
3. 1-hour free period → user can select positions at :00, :15, and :30
4. User at last valid position → pressing ↓ does nothing

---

### Story 4: Selecting Time Slots
**As a** user scheduling tasks  
**I want to** select any time slot for my task  
**So that** I can schedule according to my priorities

#### Acceptance Criteria:
- [ ] First Enter/click shows task preview in selected position
- [ ] Second Enter/click confirms and saves selection
- [ ] Mouse can click any position, including over events
- [ ] Task preview clearly shows what will be scheduled
- [ ] Confirmed selection updates task and closes scheduler

#### Scenarios:
1. User navigates to 2:30 PM + Enter → task preview appears at 2:30-3:00 PM
2. User presses Enter again → task scheduled, overlay closes
3. User clicks on occupied slot → task preview shows over event
4. User clicks confirm button → task scheduled with conflict

---

### Story 5: Multi-Day Navigation
**As a** user planning ahead  
**I want to** navigate between different days  
**So that** I can schedule tasks throughout my week

#### Acceptance Criteria:
- [ ] Left/Right arrows or Tab/Shift+Tab change days
- [ ] Day transition shows loading state for calendar data
- [ ] Current date is clearly indicated
- [ ] Can navigate at least 30 days forward
- [ ] Navigation preserves time selection when possible

#### Scenarios:
1. User presses → → view shifts to tomorrow, same time highlighted
2. User navigates to Saturday → weekend schedule visible
3. User goes 2 weeks ahead → calendar events load for that day

---

### Story 6: Date Picker for Distant Dates
**As a** user scheduling far in advance  
**I want to** use a date picker for distant dates  
**So that** I don't have to navigate day by day

#### Acceptance Criteria:
- [ ] 'd' key or button opens date picker
- [ ] Calendar widget allows month/year selection
- [ ] Selected date loads in day view
- [ ] Works seamlessly with keyboard and mouse
- [ ] Shows indicators for dates with many events

#### Scenarios:
1. User presses 'd' → calendar picker appears
2. User selects date 3 months away → day view loads for that date
3. User clicks month name → month selector dropdown appears

---

### Story 7: Handling Overlapping Events
**As a** user with busy calendar  
**I want to** clearly see when events overlap  
**So that** I can make informed scheduling decisions

#### Acceptance Criteria:
- [ ] All events display side-by-side by default
- [ ] Events only overlap when screen space is insufficient
- [ ] Each event remains clickable/hoverable
- [ ] Colors remain distinguishable
- [ ] Time boundaries are clear

#### Scenarios:
1. Two meetings overlap → shown side-by-side with full visibility
2. Five events at same time → compress width, then start overlapping
3. Partial overlap → events positioned to show all start/end times
4. Many calendars visible → events compress horizontally first

---

### Story 8: Scheduling Over Conflicts
**As a** user with priorities  
**I want to** schedule tasks over existing events when needed  
**So that** I can manage competing priorities

#### Acceptance Criteria:
- [ ] Mouse can click any position regardless of occupancy
- [ ] Task preview shows over existing events
- [ ] Requires physical click to place (no keyboard)
- [ ] Same confirmation flow as any selection
- [ ] Visual layering shows task over event

#### Scenarios:
1. User clicks on meeting slot → task preview appears over event
2. User clicks confirm → task scheduled at that time
3. User uses keyboard → cannot navigate to positions without clearance
4. Scheduled task shows clearly over calendar event

---

### Story 9: Time Zone Clarity
**As a** user in PST  
**I want to** see all times in my local timezone  
**So that** I avoid confusion when scheduling

#### Acceptance Criteria:
- [ ] All times display in PST
- [ ] No timezone conversion options (MVP)
- [ ] Calendar events converted to PST if needed
- [ ] Clear "PST" indicator in header
- [ ] Daylight saving handled automatically

#### Scenarios:
1. User views scheduler → "PST" shown in header
2. Event from EST calendar → displayed in PST time
3. Daylight saving change → times adjust automatically

---

### Story 10: Closing and Canceling
**As a** user exploring options  
**I want to** cancel scheduling without changes  
**So that** I can back out of scheduling decisions

#### Acceptance Criteria:
- [ ] Escape key closes without saving
- [ ] Click outside overlay closes (with confirmation if slot selected)
- [ ] 'x' button in corner closes scheduler
- [ ] Unsaved selection prompts confirmation
- [ ] Re-opening shows fresh state

#### Scenarios:
1. User selects slot then presses Escape → "Discard selection?" prompt
2. User clicks outside → scheduler closes, task unchanged
3. User confirms discard → overlay closes without updates

---

### Story 11: Clearing Date Selection
**As a** user who changed my mind  
**I want to** clear a previously set date  
**So that** I can unschedule a task

#### Acceptance Criteria:
- [ ] Shift+Delete keyboard shortcut clears date
- [ ] Clear button visible when date is set
- [ ] Confirmation required before clearing
- [ ] Visual feedback shows date removed
- [ ] Works for both scheduled date and deadline

#### Scenarios:
1. Task has date, user presses Shift+Delete → "Clear date?" confirmation
2. User clicks clear button → date selection removed
3. User confirms → task updated without date, overlay closes

---

### Story 12: Managing Calendar Visibility
**As a** user with many calendars  
**I want to** hide calendars I don't care about  
**So that** I can focus on relevant events

#### Acceptance Criteria:
- [ ] Checkbox list shows all available calendars
- [ ] Unchecking hides calendar events from view
- [ ] Settings persist in local storage
- [ ] Calendar colors shown next to names
- [ ] Changes apply immediately

#### Scenarios:
1. User unchecks "Birthdays" calendar → birthday events disappear
2. User refreshes page → hidden calendars remain hidden
3. User toggles calendar → events appear/disappear instantly
4. New calendar added → appears checked by default

---

## Future User Stories (Post-MVP)

### Duration Adjustment
**As a** user with varying task lengths  
**I want to** adjust task duration  
**So that** I can accurately represent time needs

- Use ←/→ arrows to adjust in 15-minute increments
- See available slots update based on duration
- Visual preview of task block size

### Working Hours
**As a** user with set work hours  
**I want to** see and respect working hour boundaries  
**So that** I maintain work-life balance

- Configure working hours (e.g., 9 AM - 6 PM)
- Visual indicators for work vs personal time
- Option to restrict navigation to working hours

### Calendar Event Creation
**As a** power user  
**I want to** create calendar events from scheduled tasks  
**So that** my calendar fully reflects my commitments

- Option to "Create calendar event" after scheduling
- Choose which calendar to add to
- Sync task updates with calendar event