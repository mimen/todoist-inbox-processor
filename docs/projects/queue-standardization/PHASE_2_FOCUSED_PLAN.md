# Queue Standardization Phase 2 - Focused Implementation Plan

Based on user feedback, this focused plan prioritizes the most critical fixes and practical features.

## Phase Structure

| Phase | Name | Duration | Focus |
|-------|------|----------|--------|
| 2A | Critical Fixes | 1-2 weeks | JSON config + wrapper minimization |
| 2B | Practical Features | 1-2 weeks | Queue persistence + sorting + workflows |
| 2C | Polish & Enhancement | 1 week | Real-time config + remaining features |

---

## Phase 2A: Critical Fixes (Top Priority)

### Duration: 1-2 weeks

### Objectives
1. **MOST CRITICAL**: Make all dropdowns respect JSON configuration
2. **MOST CRITICAL**: Minimize wrapper component code
3. Complete FilterDropdown migration
4. Remove multi-select issues (move full multi-select to later phase)

### Tasks

#### 1. **Standardize JSON Configuration Usage** (3 days)

**Problem**: Only ProjectDropdown reads from JSON config; others use hardcoded values.

**Solution**:
- [ ] Replace all `DEFAULT_QUEUE_CONFIG` usage with `useQueueConfig()`
- [ ] Ensure all dropdowns respect multiSelect, sortBy, hideEmpty settings
- [ ] Add configuration validation with clear error messages
- [ ] Test configuration changes work immediately

**Files to Update**:
- All `*Dropdown.tsx` components - use `useQueueConfig()`
- `hooks/useQueueConfig.ts` - add validation
- `constants/queue-config.ts` - mark as fallback only

**Deliverables**:
- All dropdowns respect JSON configuration immediately
- Clear error messages for invalid configs
- No more hardcoded configuration values

#### 2. **Minimize Wrapper Component Code** (4 days)

**Problem**: Individual dropdown components have too much logic.

**UnifiedDropdown Complexity Options**:

**Option A: Type-Based Auto-Configuration (Recommended)**
```typescript
// Wrapper becomes minimal:
const ProjectDropdown = ({ value, onChange, ...props }) => (
  <UnifiedDropdown
    type="project"
    value={value}
    onChange={onChange}
    {...props}
  />
)

// UnifiedDropdown handles everything internally:
// - Loads options via useProjectOptions
// - Loads config via useQueueConfig  
// - Handles value transformations
// - Applies sorting and filtering
```

**Option B: Explicit Hook-Based**
```typescript
// Wrapper handles data loading:
const ProjectDropdown = ({ value, onChange, ...props }) => {
  const options = useProjectOptions()
  const config = useQueueConfig('project')
  
  return (
    <UnifiedDropdown
      options={options}
      config={config}
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}
```

**Recommendation**: Option A - UnifiedDropdown becomes smarter, wrappers become minimal (~5-10 lines each)

**Files to Update**:
- `components/UnifiedDropdown.tsx` - accept `type` prop, auto-load everything
- All `*Dropdown.tsx` - reduce to minimal wrappers
- `hooks/useDropdownConfig.ts` - smart defaults by type

#### 3. **Complete FilterDropdown Migration** (2 days)

**Solution**:
- [ ] Create `useFilterOptions` hook
- [ ] Migrate FilterDropdown to UnifiedDropdown pattern
- [ ] Support configuration via JSON

#### 4. **Real-Time Configuration Updates** (2 days)

**Problem**: Config changes require server restart.

**Solution**:
- [ ] Watch config file for changes
- [ ] Hot-reload configuration without page refresh
- [ ] Show visual feedback when config updates

**Implementation**:
```typescript
// Enhanced config hook with hot reload
export function useQueueConfig() {
  const [config, setConfig] = useState(defaultConfig)
  
  useEffect(() => {
    // Watch for file changes in development
    const interval = setInterval(async () => {
      const response = await fetch('/config/queue-config.json')
      const newConfig = await response.json()
      if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
        setConfig(newConfig)
      }
    }, 1000) // Check every second in dev
    
    return () => clearInterval(interval)
  }, [config])
  
  return config
}
```

### Success Criteria for Phase 2A
- [ ] All dropdowns respect JSON configuration changes immediately
- [ ] Wrapper components are ~5-10 lines each
- [ ] Configuration changes apply without server restart
- [ ] FilterDropdown uses UnifiedDropdown
- [ ] No functional regressions

---

## Phase 2B: Practical Features (High Value)

### Duration: 1-2 weeks

### Objectives
- Add queue progress persistence (current queue + completed queues)
- Implement sorting options with JSON configuration
- Create practical workflow modes for different use cases

### Tasks

#### 1. **Queue Progress Persistence** (3 days)

**Focus**: Current queue position and completed queues (not full state persistence)

**Solution**:
- [ ] Persist current queue position in localStorage
- [ ] Persist completed queues list
- [ ] Restore progress on page refresh
- [ ] Clear progress when switching modes

**Implementation**:
```typescript
// Focused on queue progress only
interface QueueProgress {
  currentQueueId: string | null
  completedQueueIds: string[]
  modeType: ProcessingModeType
  modeValue: string
}

export function useQueueProgressPersistence() {
  // Save/restore just queue progress
  // Clear when mode changes
  // Simple localStorage implementation
}
```

#### 2. **Dropdown Sorting System** (3 days)

**Solution**:
- [ ] Add sorting options to each dropdown type in JSON config
- [ ] Support common sort types: name, count, priority, usage
- [ ] Add sort direction (asc/desc)
- [ ] Make default sort configurable per dropdown

**JSON Configuration**:
```json
{
  "standardModes": {
    "project": {
      "sortBy": "count",
      "sortDirection": "desc",
      "sortOptions": ["name", "count", "priority"],
      "multiSelect": false
    },
    "priority": {
      "sortBy": "priority",
      "sortDirection": "desc"
    }
  }
}
```

**Files to Update**:
- `hooks/use*Options.ts` - implement sorting logic
- `public/config/queue-config.json` - add sort configurations
- `components/UnifiedDropdown.tsx` - optional sort UI controls

#### 3. **Practical Workflow Modes** (3 days)

**Focus**: Create useful built-in queue configurations for different work scenarios

**Workflow Templates to Create**:

**Daily Planning Mode**:
- High priority tasks (P1, P2)
- Due today/overdue tasks  
- Quick wins (low effort, high impact)

**System Maintenance Mode**:
- Tasks without projects (need organizing)
- Old tasks (created >30 days ago)
- Tasks without due dates (need scheduling)

**Execution Mode**:
- Current sprint/active projects only
- Tasks by context (@calls, @computer, @errands)
- Time-boxed by estimated effort

**Implementation**:
```json
// Add to queue-config.json
{
  "workflowModes": {
    "dailyPlanning": {
      "sequence": ["priority", "date", "project"],
      "filters": {
        "priority": ["1", "2"],
        "date": ["overdue", "today"]
      }
    },
    "systemMaintenance": {
      "sequence": ["project", "date", "priority"],
      "filters": {
        "project": ["none"],
        "date": ["old", "no_date"]
      }
    }
  }
}
```

### Success Criteria for Phase 2B
- [ ] Queue progress persists across page refreshes
- [ ] Sorting works for all dropdowns with JSON configuration
- [ ] 3 practical workflow modes implemented and tested
- [ ] Configuration changes apply in real-time

---

## Phase 2C: Polish & Enhancement (Nice to Have)

### Duration: 1 week

### Objectives
- Polish remaining rough edges
- Add any missing sorting/configuration features
- Optimize performance if needed

### Tasks

#### 1. **Multi-Select Support** (Moved from 2A)
- Complete multi-select value handling
- Fix any remaining issues with mode switching

#### 2. **Enhanced Configuration UI** (Optional)
- Simple config editor if time permits
- Focus on JSON editing with real-time preview

#### 3. **Performance & Polish**
- Optimize re-renders
- Add loading states
- Improve error handling

---

## Key Decisions Made

1. **UnifiedDropdown Complexity**: Option A (type-based auto-configuration)
2. **Multi-Select**: Moved to Phase 2C (not critical)
3. **State Persistence**: Focus only on queue progress, not full state
4. **Configuration**: JSON editing acceptable, real-time preview important
5. **Workflow Modes**: Start with 3 practical built-in modes
6. **Sorting**: Configurable via JSON with sensible defaults

---

## Next Steps

1. **Confirm Approach**: Review UnifiedDropdown complexity options (A vs B)
2. **Start Phase 2A**: Begin with JSON config standardization
3. **Test Real-Time Config**: Ensure changes apply without server restart
4. **Validate Workflow Modes**: Confirm the 3 modes match your workflow needs

**Questions**:
- Do you prefer UnifiedDropdown Option A (type-based) or Option B (explicit)?
- Are the 3 workflow modes (daily planning, system maintenance, execution) the right ones to start with?
- Any specific sorting priorities for different dropdown types?