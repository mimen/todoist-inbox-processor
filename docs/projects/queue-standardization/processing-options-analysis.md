# Processing Options Analysis: Extending the Inbox Processor

## Current Implementation: Processing Project Dropdown

### How It Works Now

The current implementation uses a single "Processing Project" dropdown that filters tasks by project:

```typescript
// Current state in TaskProcessor.tsx
const [selectedProjectId, setSelectedProjectId] = useState("2339440032"); // Inbox
const [allTasksGlobal, setAllTasksGlobal] = useState<TodoistTask[]>([]);
const [allTasks, setAllTasks] = useState<TodoistTask[]>([]);
```

**Data Flow:**
1. On load: Fetch all tasks and projects once
2. User selects project from dropdown
3. `loadProjectTasks()` filters `allTasksGlobal` by `projectId`
4. Updates `allTasks` with filtered results
5. TaskForm processes tasks from the filtered queue

**Key Features:**
- Client-side filtering (no API calls on switch)
- Task counts per project
- Hierarchical project display
- Search within dropdown
- Immediate updates

### Current Filtering Logic

```typescript
// In loadProjectTasks()
const projectTasks = allTasksGlobal.filter(
  (task) => 
    task.projectId === projectId && 
    !task.content.startsWith("* ")
);
```

## Proposed Extension: Multiple Processing Options

### 1. New Processing Modes

Instead of just "Processing Project", we'll have:

```
┌─────────────────────────────────────────────────┐
│ Processing: [Dropdown with options]             │
│   • By Project  (current implementation)        │
│   • By Priority                                 │
│   • By Label                                    │
│   • Custom Filter                               │
└─────────────────────────────────────────────────┘
```

### 2. Extended State Management

```typescript
// Proposed state structure
interface ProcessingMode {
  type: 'project' | 'priority' | 'label' | 'custom';
  value: string | string[]; // projectId, priority level, label name(s), or filter query
  displayName: string;
}

const [processingMode, setProcessingMode] = useState<ProcessingMode>({
  type: 'project',
  value: '2339440032', // Inbox
  displayName: 'Inbox'
});
```

### 3. UI Component Structure

```
TaskProcessor
├── ProcessingModeSelector (new)
│   ├── Mode Dropdown (Project/Priority/Label/Custom)
│   └── Dynamic Value Selector
│       ├── ProjectDropdown (existing)
│       ├── PriorityDropdown (new)
│       ├── LabelDropdown (new)
│       └── CustomFilterInput (new)
└── TaskForm (existing, unchanged)
```

### 4. Filtering Implementation

```typescript
// Universal filtering function
function filterTasksByMode(
  tasks: TodoistTask[], 
  mode: ProcessingMode
): TodoistTask[] {
  // Always exclude archived tasks
  let filtered = tasks.filter(task => !task.content.startsWith("* "));
  
  switch (mode.type) {
    case 'project':
      return filtered.filter(task => task.projectId === mode.value);
      
    case 'priority':
      return filtered.filter(task => task.priority === parseInt(mode.value));
      
    case 'label':
      const labels = Array.isArray(mode.value) ? mode.value : [mode.value];
      return filtered.filter(task => 
        task.labels.some(label => labels.includes(label))
      );
      
    case 'custom':
      return applyTodoistFilter(filtered, mode.value as string);
  }
}
```

## Priority Processing

### Priority Levels
- Priority 1 (p1): Urgent - Red flag
- Priority 2 (p2): High - Orange flag  
- Priority 3 (p3): Medium - Yellow flag
- Priority 4 (p4): Low - White/no flag

### Default Sorting
- **Within same priority**: Sort by due date (earliest first)
- **No due date**: Sort by creation date (oldest first)
- **Overdue tasks**: Always show first

### UI Mockup
```
Processing: Priority ▼
├── 🔴 Priority 1 (12 tasks)
├── 🟠 Priority 2 (34 tasks)
├── 🟡 Priority 3 (56 tasks)
├── ⚪ Priority 4 (78 tasks)
└── ⚫ No Priority (123 tasks)
```

## Label Processing

### Label Types
- Personal labels (e.g., @home, @work)
- Shared labels (in shared projects)
- System labels (if any)

### Multi-Select Capability
- Allow selecting multiple labels
- AND/OR logic options
- Show task count for each combination

### UI Mockup
```
Processing: Labels ▼
├── 📍 Single Label
│   ├── @next (45 tasks)
│   ├── @waiting (23 tasks)
│   └── @quick (67 tasks)
└── 🔗 Multiple Labels
    ├── Select labels...
    └── Logic: [AND | OR]
```

## Custom Filter Processing

### Todoist Query Language Support
Enable full Todoist filter syntax:
- `today | overdue`
- `p1 & @work`
- `due before: tomorrow & !@waiting`
- `assigned to: me & #ProjectName`

### JSON Configuration

```json
{
  "customFilters": [
    {
      "id": "urgent-work",
      "name": "Urgent Work Items",
      "filter": "(p1 | p2) & @work & !@waiting",
      "icon": "🚨",
      "sortBy": "priority",
      "sortOrder": "desc"
    },
    {
      "id": "quick-wins",
      "name": "Quick Wins Today",
      "filter": "@quick & (today | overdue)",
      "icon": "⚡",
      "sortBy": "due_date",
      "sortOrder": "asc"
    },
    {
      "id": "weekly-review",
      "name": "Weekly Review Items",
      "filter": "due date: next 7 days & !@someday",
      "icon": "📊",
      "sortBy": "project",
      "sortOrder": "asc"
    }
  ]
}
```

### UI Mockup
```
Processing: Custom Filter ▼
├── 📌 Saved Filters
│   ├── 🚨 Urgent Work Items (8 tasks)
│   ├── ⚡ Quick Wins Today (15 tasks)
│   └── 📊 Weekly Review Items (42 tasks)
└── ➕ New Custom Filter
    └── [Enter Todoist filter query...]
```

## Implementation Plan

### Phase 1: Refactor Current Implementation
1. Extract filtering logic to separate module
2. Create `ProcessingMode` type system
3. Update state management in TaskProcessor

### Phase 2: Add Priority Processing
1. Create PriorityDropdown component
2. Implement priority filtering logic
3. Add priority-based sorting

### Phase 3: Add Label Processing
1. Create LabelDropdown component
2. Implement multi-select UI
3. Add AND/OR logic for labels

### Phase 4: Add Custom Filters
1. Create filter configuration system
2. Implement Todoist query parser
3. Add saved filter management

### Phase 5: Persistence & UX
1. Save last used processing mode
2. Add keyboard shortcuts for mode switching
3. Implement smooth transitions between modes

## Benefits of This Approach

1. **Flexibility**: Users can process tasks by different criteria
2. **Efficiency**: Quick switching between processing modes
3. **Customization**: Save frequently used filters
4. **Consistency**: All modes use same underlying task queue
5. **Performance**: Client-side filtering remains fast

## Technical Considerations

### State Persistence
```typescript
// Save to localStorage
localStorage.setItem('processingMode', JSON.stringify(processingMode));
localStorage.setItem('customFilters', JSON.stringify(customFilters));
```

### Filter Validation
- Validate Todoist query syntax before applying
- Show error messages for invalid filters
- Provide filter syntax help/examples

### Performance
- Continue loading all tasks once
- Index tasks by project, priority, and label for faster filtering
- Debounce custom filter input

### Keyboard Navigation
- `Cmd/Ctrl + P`: Switch to Project mode
- `Cmd/Ctrl + 1-4`: Switch to Priority 1-4
- `Cmd/Ctrl + L`: Switch to Label mode
- `Cmd/Ctrl + F`: Switch to Custom Filter mode

## Next Steps

1. Create type definitions for ProcessingMode
2. Build ProcessingModeSelector component
3. Refactor existing ProjectDropdown for reuse
4. Implement priority and label dropdowns
5. Design custom filter configuration system