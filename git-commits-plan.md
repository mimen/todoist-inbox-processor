# Git Commits Plan

## Commit 1: Fix Todoist API - Add deleteTask method for permanent task deletion
**Purpose**: Add proper task deletion functionality to permanently remove tasks instead of just marking them complete

```bash
git add lib/todoist-api.ts
git add app/api/todoist/tasks/[taskId]/route.ts
```

**Commit message**:
```
feat: Add deleteTask method to permanently delete tasks

- Add deleteTask method to TodoistApiClient using Sync API item_delete
- Update DELETE endpoint to use deleteTask instead of closeTask
- Fixes task deletion in List View to actually remove tasks from Todoist

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Commit 2: Improve List View UI/UX
**Purpose**: Enhance List View styling, fix highlighted states, and improve visual consistency

```bash
git add components/ListView/TaskListItem.tsx
git add components/ListView/ListView.tsx
git add components/KeyboardShortcuts.tsx
git add app/globals.css
```

**Commit message**:
```
style: Improve List View styling and keyboard navigation

- Always show More menu icon (removed hover-only behavior)
- Fix highlighted state with subtle shadow instead of thick border
- Fix edit mode to maintain consistent row height
- Split keyboard shortcuts into two columns for better readability
- Disable browser default focus outline to prevent interference
- Reduce task row height and More icon size for cleaner look

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Commit 3: Fix ProcessingModeSelector to prevent premature mode changes
**Purpose**: Fix issue where selecting a processing option immediately changed the display name before actually loading tasks

```bash
git add components/ProcessingModeSelector.tsx
```

**Commit message**:
```
fix: Prevent premature processing mode display name changes

- Add separate state for selected processing type vs active mode
- Only update processing mode when user selects actual value
- Fix label dropdown error by ensuring selectedLabels is always array
- Prevents metadata hiding and display name changes before queue loads

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Commit 4: Add Google Calendar integration with Redis caching
**Purpose**: Implement calendar event display with efficient caching and sync system

```bash
git add app/api/calendar/
git add components/CalendarGrid.tsx
git add components/CalendarStoreInitializer.tsx
git add components/SyncStatus.tsx
git add components/SyncStatusModal.tsx
git add components/TaskSchedulerView.tsx
git add lib/calendar-event-store.ts
git add lib/calendar-sync-service.ts
git add lib/google-calendar-service.ts
git add app/api/auth/google/callback/route.ts
```

**Commit message**:
```
feat: Add Google Calendar integration with Redis caching

- Implement calendar event fetching with OAuth 2.0
- Add Redis-based event caching with sync tokens
- Create incremental sync system (95% API call reduction)
- Add calendar grid UI component for event display
- Implement sync status monitoring and manual refresh
- Add automatic background sync every 15 minutes

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Commit 5: Fix client-side Redis import error
**Purpose**: Refactor calendar hooks to use API routes instead of direct Redis access

```bash
git add hooks/useCalendarEvents.ts
```

**Commit message**:
```
fix: Remove Redis dependency from client-side code

- Refactor useCalendarEvents to fetch from API endpoint
- Remove direct calendar-event-store import causing crypto error
- Maintain same interface while using /api/calendar/events
- Fix "Module build failed" error for node:crypto

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Commit 6: Update Task Processor to include calendar integration
**Purpose**: Integrate calendar views into task scheduling overlays

```bash
git add components/TaskProcessor.tsx
git add components/ScheduledDateSelector.tsx
git add components/DeadlineSelector.tsx
git add app/page.tsx
```

**Commit message**:
```
feat: Integrate calendar view into task scheduling

- Add TaskSchedulerView to ScheduledDateSelector overlay
- Update DeadlineSelector with calendar integration
- Initialize calendar store on app startup
- Fix progress indicator to only show in Processing View

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Commit 7: Update documentation and dependencies
**Purpose**: Update project documentation and add Redis dependency

```bash
git add CLAUDE.md
git add docs/projects/list-view/PROJECT-STATUS.md
git add docs/projects/task-scheduler/04-SPECIFICATIONS/Technical-Architecture.md
git add docs/projects/task-scheduler/sync-token-architecture.md
git add docs/projects/task-scheduler/todoist-sync-integration.md
git add package.json
git add package-lock.json
git add yarn.lock
```

**Commit message**:
```
docs: Update project documentation and dependencies

- Add Redis to development commands in CLAUDE.md
- Update List View project status with completed features
- Document calendar sync architecture and implementation
- Add redis and @types/redis dependencies
- Update technical architecture with caching details

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Files to ignore:
```bash
# Don't commit Redis dump file
# Add to .gitignore if not already there
dump.rdb
```

## Suggested .gitignore addition:
```
# Redis
dump.rdb
*.rdb
```