# Workflow Modes - Detailed Design

## Overview
Workflow modes are predefined queue sequences optimized for specific productivity goals. Each mode configures the queue order, filtering, and UI to support different work patterns throughout the day.

## Core Workflow Modes

### 1. 🌅 **Morning Review Mode**
**Purpose**: Start the day with clarity by reviewing and organizing tasks

**Queue Sequence**:
1. **Inbox** - Process all unorganized tasks first
2. **Overdue** - Address what wasn't completed yesterday
3. **Today** - Review what's planned for today
4. **Priority P1** - Ensure urgent tasks are visible
5. **@waiting** - Check on blocked tasks
6. **No Project** - Assign orphaned tasks to projects

**Features**:
- Bulk operations enabled for quick reorganization
- Show empty queues to confirm nothing is missed
- Quick reschedule shortcuts
- Suggested labels: @today, @defer, @delegate

**Use When**: First thing in the morning, during weekly planning

---

### 2. 🎯 **Focus Execution Mode**
**Purpose**: Get things done without distractions

**Queue Sequence**:
1. **@next & P1** - Most important next actions
2. **@quick & (today | overdue)** - Quick wins to build momentum
3. **Current Project** - Deep work on active project
4. **@deep-work** - Tasks requiring focused attention

**Features**:
- Hide empty queues to maintain flow
- Minimal UI with larger text
- Timer integration for pomodoros
- Disable multi-select to focus on one task at a time
- Auto-advance to next task

**Use When**: During focused work blocks, deep work sessions

---

### 3. 🚀 **Quick Wins Mode**
**Purpose**: Build momentum by completing many small tasks

**Queue Sequence**:
1. **@quick** - All quick tasks regardless of date
2. **P4 Priority** - Low priority but easy tasks
3. **Tasks < 15 min** (estimated duration)
4. **Single-step tasks** (no subtasks)

**Features**:
- Bulk complete functionality
- Sort by estimated time (shortest first)
- Gamification: streak counter
- Celebration animations on queue completion

**Use When**: Low energy periods, need motivation boost

---

### 4. 🏠 **Context Switching Mode**
**Purpose**: Process tasks by location/context efficiently

**Queue Sequence**:
1. **@errands** - Tasks to do while out
2. **@home** - Home context tasks
3. **@office** - Office-specific tasks
4. **@computer** - Digital tasks
5. **@phone** - Call-based tasks

**Features**:
- Location-based filtering
- Batch similar tasks together
- Integration with calendar for time blocking
- Context-specific tool suggestions

**Use When**: Planning errands, working from different locations

---

### 5. 📊 **Project Sprint Mode**
**Purpose**: Make significant progress on specific projects

**Queue Sequence**:
1. **Current Sprint Project** - All tasks in sprint project
2. **Blocked Tasks in Project** - Identify impediments
3. **Project Milestones** - Track major deliverables
4. **Related Projects** - Dependencies from other projects

**Features**:
- Project-specific view with hierarchy
- Burndown chart visualization
- Dependency tracking
- Team member assignment views (if collaborative)

**Use When**: Project deadlines approaching, sprint work sessions

---

### 6. 🧹 **System Maintenance Mode**
**Purpose**: Keep your task system clean and organized

**Queue Sequence**:
1. **Duplicate Tasks** - Merge similar tasks
2. **No Labels** - Add context to tasks
3. **No Priority** - Set appropriate priorities
4. **Stale Tasks** (30+ days old) - Review and update
5. **@someday** - Move to active or delete
6. **Completed Today** - Review for patterns

**Features**:
- Bulk edit operations
- Duplicate detection algorithms
- Age indicators on tasks
- Archive suggestions
- Task health metrics

**Use When**: Weekly reviews, monthly cleanup sessions

---

### 7. 📅 **Weekly Planning Mode**
**Purpose**: Plan the upcoming week strategically

**Queue Sequence**:
1. **Next 7 Days** - What's already scheduled
2. **P1-P2 Unscheduled** - High priority without dates
3. **@this-week** - Intended for this week
4. **Project Deadlines This Week** - Project-based view
5. **Recurring This Week** - Routine tasks
6. **@someday candidates** - Potential activation

**Features**:
- Calendar integration view
- Drag-and-drop to calendar
- Workload balancing indicators
- Time estimation totals
- Batch scheduling tools

**Use When**: Sunday planning, weekly reviews

---

### 8. 🌙 **End of Day Mode**
**Purpose**: Wrap up today and prepare for tomorrow

**Queue Sequence**:
1. **Incomplete Today** - Reschedule unfinished tasks
2. **Tomorrow** - Preview next day
3. **@followup** - Log follow-up items
4. **Quick Evening Tasks** - Before bed routines
5. **Journal/Notes** - Capture thoughts

**Features**:
- One-click reschedule to tomorrow
- Daily summary statistics
- Note capture for completed tasks
- Energy level tracking
- Tomorrow's highlight selection

**Use When**: End of workday, before bed

---

### 9. 🔥 **Crisis Management Mode**
**Purpose**: Handle urgent situations and overdue items

**Queue Sequence**:
1. **Overdue P1** - Critical overdue tasks
2. **Today P1** - Today's urgent items
3. **@urgent** - Urgently labeled tasks
4. **@blocked** - Tasks blocking others
5. **Customer/Client Tasks** - External commitments

**Features**:
- Red alert UI theme
- Direct communication shortcuts
- Escalation options
- Time-to-deadline countdown
- Auto-notification to stakeholders

**Use When**: Many overdue tasks, deadline crisis

---

### 10. 🎨 **Creative Work Mode**
**Purpose**: Focus on creative and strategic tasks

**Queue Sequence**:
1. **@creative** - Creative tasks
2. **@brainstorm** - Ideation needed
3. **@strategy** - Strategic planning
4. **No Deadline Creative** - Open-ended creative work
5. **Inspiration Queue** - Saved ideas

**Features**:
- Distraction-free UI
- Inspiration/reference panel
- Voice note capture
- Sketch/attachment support
- Mood-based filtering

**Use When**: Creative sessions, strategy planning

---

## Implementation Details

### Mode Configuration Structure
```typescript
interface WorkflowMode {
  id: string
  name: string
  icon: string
  description: string
  purpose: string
  queues: QueueSequence[]
  features: ModeFeatures
  uiCustomization: UISettings
  shortcuts: KeyboardShortcuts
  analytics: AnalyticsConfig
}

interface QueueSequence {
  type: 'filter' | 'project' | 'label' | 'priority' | 'date' | 'custom'
  filter: string // Todoist filter syntax
  name: string
  icon?: string
  sortBy?: SortOption
  limit?: number
}

interface ModeFeatures {
  bulkOperations: boolean
  showEmptyQueues: boolean
  autoAdvance: boolean
  timerIntegration: boolean
  quickActions: string[]
  suggestedLabels: string[]
  enableMultiSelect: boolean
}
```

### Mode Selection UI
- **Quick Switch**: Dropdown in header for fast mode changes
- **Mode Dashboard**: Visual grid of all modes with usage stats
- **Contextual Suggestions**: Recommend modes based on time of day
- **Favorites**: Pin frequently used modes
- **Custom Modes**: User-created workflow sequences

### Intelligent Features

#### Time-Based Recommendations
- Morning: Suggest "Morning Review Mode"
- Deep work blocks: Suggest "Focus Execution Mode"
- End of day: Suggest "End of Day Mode"
- Friday: Suggest "Weekly Planning Mode"

#### Adaptive Queue Ordering
- Learn from user behavior
- Adjust queue sequence based on usage patterns
- Skip consistently empty queues
- Suggest new queues based on task patterns

#### Performance Optimizations
- Preload next queue while processing current
- Cache queue counts for faster switching
- Lazy load queue contents
- Background sync for real-time updates

### Analytics and Insights
- Time spent in each mode
- Tasks completed per mode
- Most productive modes
- Mode switching patterns
- Suggested optimizations

## Future Enhancements

### 1. **AI-Powered Mode Selection**
- Analyze task patterns to suggest optimal mode
- Predict best mode based on calendar and history
- Custom mode generation based on work patterns

### 2. **Team Workflow Modes**
- Shared modes for team coordination
- Role-based mode assignments
- Team performance tracking

### 3. **Integration Modes**
- Calendar-based modes (meeting prep, follow-up)
- Email-triggered modes
- Slack status integration

### 4. **Gamification**
- Mode completion achievements
- Productivity streaks
- Team competitions

### 5. **Voice Control**
- "Hey Todoist, start focus mode"
- Voice task creation within modes
- Audio summaries of queues