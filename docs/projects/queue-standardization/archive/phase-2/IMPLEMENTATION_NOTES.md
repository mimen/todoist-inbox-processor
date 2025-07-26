# Prioritized Dropdown - Implementation Notes

## Key Findings from Code Analysis

### 1. Existing Smart Filters
The system already has preset filters in `PRESET_FILTERS`:
- `daily-planning` - P1 tasks, due today, or overdue
- `priority-projects` - Tasks in P1 projects
- `due-projects` - Tasks in projects due this week

We need to add:
- `overdue-all` - Overdue by schedule OR deadline
- `today-all` - Due today by schedule OR deadline
- `p2-projects` - Tasks in P2 projects

### 2. UnifiedDropdown Architecture
- All dropdowns use UnifiedDropdown component
- Option hooks provide the data (useProjectOptions, usePriorityOptions, etc.)
- We can create a new `usePrioritizedOptions` hook that combines options from multiple sources

### 3. Priority Project Expansion
Instead of showing "P1 Projects" as a single option:
- Iterate through all projects
- Filter for P1/P2 priority
- Add each as an individual dropdown option
- This gives users granular control over which priority project to work on

### 4. Configuration Structure
- Add `prioritizedQueue` section to config
- Each item specifies: type, value, name, icon
- Special type `priority-projects` triggers expansion behavior

## Implementation Strategy

### Step 1: Add Smart Filters (Day 1)
1. Add `overdue-all` filter to PRESET_FILTERS
2. Add `today-all` filter to PRESET_FILTERS
3. Add `p2-projects` filter to PRESET_FILTERS
4. Test filters work correctly with existing PresetDropdown

### Step 2: Create Prioritized Options Hook (Day 2)
1. Create `usePrioritizedOptions` hook
2. Combine options from different sources based on config
3. Implement priority project expansion logic
4. Return unified options array

### Step 3: Create Prioritized Dropdown (Day 3)
1. Create PrioritizedDropdown component
2. Use UnifiedDropdown internally
3. Handle mode conversion when option selected
4. Register as new dropdown type

### Step 4: Integration (Day 4)
1. Add to ProcessingModeSelector
2. Add "prioritized" to ProcessingModeType
3. Update configuration schema
4. Test end-to-end

## Design Decisions

### Why Smart Filters?
- Reuses existing preset filter infrastructure
- Filters are already tested and working
- Can be used independently or in prioritized dropdown
- Named filters are more maintainable than inline queries

### Why Priority Project Expansion?
- Users often have multiple P1/P2 projects
- Combining them loses granularity
- Individual options allow focused work
- Still grouped visually by the icon prefix

### Why New Dropdown Type?
- Keeps existing dropdowns unchanged
- Allows custom ordering logic
- Can combine different processing modes
- Easy to enable/disable via config

## Testing Approach

1. **Smart Filter Tests**: Verify new filters match correct tasks
2. **Hook Tests**: Test option combination and expansion
3. **Integration Tests**: Test mode switching and task filtering
4. **Config Tests**: Verify configuration changes update dropdown