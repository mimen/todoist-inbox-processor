# Todoist Inbox Processor - Improved Architecture

## Improved Data Flow (After Fix)

```mermaid
graph TB
    %% Initial Data Loading
    Start([App Start]) --> LoadInitial[Load Initial Data]
    LoadInitial --> |API Calls| LoadData{Load from API}
    LoadData --> AllTasks[allTasksGlobal: TodoistTask[]]
    LoadData --> Projects[projects: TodoistProject[]]
    LoadData --> Labels[labels: TodoistLabel[]]
    
    %% Global Filtering Layer (NEW)
    AllTasks --> GlobalFilter[globallyFilteredTasks: Memoized]
    GlobalFilter --> |1. Exclude archived '*'| ExcludeArchived
    ExcludeArchived --> |2. Exclude labels| ExcludeLabels
    ExcludeLabels --> |3. Apply assignee filter| AssigneeFilter
    AssigneeFilter --> FilteredTasks[Globally Filtered Tasks]
    
    %% Mode-specific filtering
    FilteredTasks --> ProcessingMode{Processing Mode}
    ProcessingMode -->|project| ProjectFilter[Filter by Project]
    ProcessingMode -->|priority| PriorityFilter[Filter by Priority]
    ProcessingMode -->|label| LabelFilter[Filter by Label]
    ProcessingMode -->|prioritized| PrioritizedQueue[Use Prioritized Queue]
    
    %% View Mode Decision
    FilteredTasks --> ViewMode{View Mode}
    ViewMode -->|processing| ProcessingView[Processing Mode UI]
    ViewMode -->|list + multiListMode| MultiListView[Multi-List Container]
    ViewMode -->|list + !multiListMode| SingleListView[Single List View]
    
    %% UI Components (Always Rendered)
    UI[UI Layer] --> Header[Header Section]
    UI --> Content[Content Section]
    UI --> Modals[Modals & Overlays]
    
    Header --> AssigneeDropdown[Assignee Filter]
    Header --> SettingsBtn[Settings Button - Always Visible]
    
    Modals --> SettingsModal[Settings Modal - Always in DOM]
    Modals --> KeyboardShortcuts[Keyboard Shortcuts Modal]
    
    %% State Changes (No Side Effects)
    AssigneeDropdown -.->|Updates State| AssigneeFilter
    SettingsBtn -.->|Opens| SettingsModal
    SettingsModal -.->|Updates| Settings[Settings Context]
    
    style GlobalFilter fill:#90EE90
    style SettingsBtn fill:#FFD700
    style SettingsModal fill:#FFD700
```

## Key Improvements

### 1. **Global Filtering Layer**
```typescript
const globallyFilteredTasks = useMemo(() => {
  let filtered = allTasksGlobal
  
  // Apply all global filters
  filtered = filtered.filter(task => !task.content.startsWith('* '))
  filtered = filtered.filter(task => !task.labels.some(isExcludedLabel))
  
  // Apply assignee filter
  if (assigneeFilter !== 'all') {
    filtered = filtered.filter(task => {
      // Filter logic based on assigneeFilter
    })
  }
  
  return filtered
}, [allTasksGlobal, assigneeFilter, currentUserId])
```

### 2. **No Data Reload on Filter Change**
- Removed `assigneeFilter` from `loadTasksForMode` dependencies
- Filter changes are now pure view-layer operations
- Processing mode remains stable when filters change

### 3. **Single Render Path**
- Settings modal is now rendered in all states (including empty state)
- No early returns that skip rendering essential UI components
- All modals and overlays are always in the DOM

### 4. **Simplified Multi-List Logic**
- Multi-list mode depends only on:
  - `viewMode === 'list'`
  - `settings.listView.multiListMode === true`
- No longer requires `processingMode.type === 'prioritized'`

## Benefits

1. **Performance**: No unnecessary API calls or data reloads when changing filters
2. **Stability**: UI state remains consistent when filters change
3. **Predictability**: Filter changes have predictable, immediate effects
4. **User Experience**: Settings always accessible, no mode switching surprises

## Data Flow Summary

1. **App Start** → Load all tasks from API once
2. **Global Filters** → Apply archived/label/assignee filters (memoized)
3. **Mode Filters** → Apply processing mode specific filters
4. **View Layer** → Display filtered tasks based on view mode
5. **User Actions** → Update state without side effects

This architecture ensures that:
- Assignee filter changes don't trigger data reloads
- Multi-list mode remains stable regardless of filter selections
- Settings and other UI controls are always accessible
- The app responds immediately to filter changes