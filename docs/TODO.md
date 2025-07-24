# TODO List

## Queue Standardization - Multi-Select Support

### Problem
- All dropdown components can theoretically support both single and multi-select modes via the JSON config
- However, parent components (ProcessingModeSelector, etc.) expect single values for most dropdowns
- When switching from multi to single select (like labels), the value handling breaks

### Current State
- LabelDropdown works in multi-select mode but has issues in single-select mode
- Other dropdowns (Project, Priority, etc.) have multi-select UI but only use the first selected value
- The value contract between dropdowns and their parents is inconsistent

### Proposed Solution
1. Standardize all dropdown components to internally handle both single/multi-select
2. Use the `useDropdownAdapter` hook to normalize value handling
3. Update parent components to handle arrays for all dropdown values
4. Make the entire system truly mode-agnostic

### Components to Update
- [ ] ProcessingModeSelector - handle array values for all modes
- [ ] Task filtering logic - support filtering by multiple projects, priorities, etc.
- [ ] All dropdown components - use standardized value handling
- [ ] Parent callbacks - accept arrays instead of single values

### Benefits
- Any dropdown can be switched between single/multi-select via JSON config
- Consistent behavior across all dropdowns
- More flexible filtering options (e.g., show tasks from multiple projects)

### Estimated Effort
- Medium-High complexity due to widespread changes needed
- Would affect core filtering logic
- Requires careful testing of all modes

## Other TODOs

### Future Enhancements
- [ ] Add drag-and-drop reordering for queue order
- [ ] Implement queue templates for different workflows
- [ ] Add conditional queue progression rules
- [ ] Create custom queue builder UI
- [ ] Add state persistence to localStorage
- [ ] Implement virtual scrolling for large dropdown lists
- [ ] Add group-by functionality for dropdown options