# Phase 2 Quick Reference Guide

## 🚨 Current Situation

**Problem**: Multi-list mode is broken
- Keyboard shortcuts only work on first list
- Focus jumps to second list on load
- State synchronization issues

**Root Cause**: Two components (ListView + MultiListContainer) fighting for control

**Solution**: Merge into single UnifiedListView component

## ✅ What's Already Done

1. **Settings System**
   - ✅ Settings modal with gear icon
   - ✅ localStorage persistence
   - ✅ Multi-list mode toggle
   - ✅ Duplicate filtering option

2. **Basic Multi-List** (buggy, needs replacement)
   - ✅ Load more button
   - ✅ Multiple lists rendering
   - ❌ Keyboard navigation (broken)
   - ❌ Focus management (broken)

## 🎯 Immediate Next Steps

### Step 1: Create UnifiedListView Component
```typescript
// New file: components/ListView/UnifiedListView.tsx
// This will eventually replace both ListView.tsx and MultiListContainer.tsx
```

### Step 2: Key Implementation Points
1. **Single keyboard handler** at the top level
2. **One focus target** (the container div)
3. **Global task array** for navigation across all lists
4. **Mode detection** (`viewMode: 'single' | 'multi'`)

### Step 3: Migration Path
1. Create new component alongside existing ones
2. Test with multi-list mode first
3. Then migrate single-list mode
4. Finally remove old components

## 📋 Task Priority Order

### Week 1: Foundation (Critical)
- [ ] LV2-UNIFIED-001: Create UnifiedListView component
- [ ] LV2-UNIFIED-002: Port single list functionality
- [ ] LV2-UNIFIED-003: Implement multi-list rendering
- [ ] LV2-UNIFIED-004: Fix keyboard navigation across lists

### Week 2: Already Done ✅
- [x] Settings system
- [x] Multi-list toggle
- [x] Duplicate filtering

### Week 3: List Enhancements
- [ ] LV2-009: Collapsible lists
- [ ] LV2-010: Enhanced headers (colors, icons)
- [ ] LV2-011: List spacing/separators

### Week 4: Bulk Operations
- [ ] LV2-012: Bulk actions bar
- [ ] LV2-013: Bulk complete
- [ ] LV2-014: Bulk delete
- [ ] LV2-015-017: Other bulk operations
- [ ] LV2-018: Multi-task scheduling

### Week 5: Polish
- [ ] LV2-019: Right-click menu
- [ ] LV2-020: Touch support

## 🔑 Key Technical Decisions

1. **State Management**
   ```typescript
   // All state in UnifiedListView, not individual lists
   const [globalHighlight, setGlobalHighlight] = useState()
   const [visibleLists, setVisibleLists] = useState(3)
   ```

2. **Task Navigation**
   ```typescript
   // Flatten all visible tasks for navigation
   const allTasks = visibleLists.flatMap(list => list.tasks)
   ```

3. **No Auto-Focus**
   ```typescript
   // Only the container focuses, never individual lists
   <div ref={containerRef} tabIndex={0} onKeyDown={handleKeys}>
   ```

## 🚀 Quick Start Commands

```bash
# Create the new component
touch components/ListView/UnifiedListView.tsx

# Copy existing ListView as starting point
cp components/ListView/ListView.tsx components/ListView/UnifiedListView.tsx

# Start implementing!
```

## 📚 Reference Documents

1. [Multi-List Architecture Issues](../../multi-list-architecture-issues.md) - Why current approach failed
2. [Phase 2 Unified Implementation Plan](./Phase-2-Unified-Implementation-Plan.md) - Detailed plan
3. [Phase 2 Task Breakdown](./03-TASKS/Phase-2-Task-Breakdown.md) - All Phase 2 features

## ⚡ Remember

- **Don't fix MultiListContainer** - Replace it entirely
- **Test keyboard navigation first** - It's the most broken part
- **Keep backward compatibility** - Don't break single list mode
- **One source of truth** - All state in the unified component