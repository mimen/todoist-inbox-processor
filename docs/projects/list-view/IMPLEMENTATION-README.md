# List View Implementation Guide

## 🚀 Quick Start for Implementation

Welcome! This guide will help you implement the List View feature efficiently. Follow this workflow to avoid common pitfalls and build it right the first time.

## 📋 Current Status: Phase 2

**Phase 1**: ✅ Complete (75% - core functionality working)  
**Phase 2**: 🚧 Starting (multi-list view and bulk operations)

## 📁 Project Structure

```
docs/projects/list-view/
├── 01-CRITICAL-READS/           # Read these first!
│   ├── CRITICAL-UI-REUSE.md     # Component reuse rules
│   ├── FINAL-IMPLEMENTATION-SUMMARY.md
│   └── Engineering-Feedback-Summary.md
│
├── 02-PLANNING/                 # Project planning
│   ├── IMPLEMENTATION_PLAN.md   # Phased approach
│   ├── PRD.md                   # Product requirements
│   └── Stakeholder-Questions.md # Decisions made
│
├── 03-TASKS/                    # Your daily checklist
│   └── Phase-2-Task-Breakdown.md # Current tasks (Phase 2)
│
├── 04-SPECIFICATIONS/           # Detailed specs
│   ├── Technical-Spec.md        # Technical details
│   ├── Technical-Architecture.md
│   └── User-Stories.md          # Feature requirements
│
├── 05-CODE-TEMPLATES/           # Ready-to-use code
│   ├── Component-Templates.md   # Component structures
│   └── Implementation-Guide.md  # Integration steps
│
├── phase-1/                     # Completed Phase 1 docs
│   └── Phase-1-Task-Breakdown.md
│
├── Phase-2-Summary.md           # Phase 2 quick reference
├── PROJECT-STATUS.md            # Current progress
└── IMPLEMENTATION-README.md     # You are here
```

## 🎯 Phase 2 Implementation Workflow

### Daily Process

1. **Start Here**: Open [Phase-2-Task-Breakdown.md](./03-TASKS/Phase-2-Task-Breakdown.md)
2. **Quick Reference**: Check [Phase-2-Summary.md](./Phase-2-Summary.md) for decisions
3. **Find Your Task**: Look for the next task (e.g., LV2-001)
4. **Get Details**: 
   - Technical approach → [Technical-Spec.md](./04-SPECIFICATIONS/Technical-Spec.md)
   - Component patterns → [Component-Templates.md](./05-CODE-TEMPLATES/Component-Templates.md)
   - Integration steps → [Implementation-Guide.md](./05-CODE-TEMPLATES/Implementation-Guide.md)

### Document Usage Flow

```
┌─────────────────────────┐
│ Phase-2-Summary.md      │ ← Quick decisions reference
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Phase-2-Task-Breakdown  │ ← Start here daily
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Technical-Spec.md       │ ← Implementation details
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Component-Templates     │ ← Reusable patterns
└─────────────────────────┘

Always check: CRITICAL-UI-REUSE.md
```

## 🏃 Phase 2 Implementation Plan

### Week 1-2: Foundation
```bash
# Multi-List Infrastructure
- [ ] LV2-001: Multi-List Container Component
- [ ] LV2-002: Progressive List Loading Logic
- [ ] LV2-003: List Order Management (follow dropdown)
- [ ] LV2-004: Empty List Display

# Settings System
- [ ] LV2-005: Settings Data Model & localStorage
- [ ] LV2-006: Settings UI (Gear Icon + Modal)
- [ ] LV2-007: Multi-List Mode Toggle
- [ ] LV2-008: Duplicate Task Filtering
```

### Week 3-4: Core Features
```bash
# List Enhancements
- [ ] LV2-009: Collapsible Lists
- [ ] LV2-010: Enhanced List Headers (icons, colors)
- [ ] LV2-011: List Separator Spacing

# Bulk Operations
- [ ] LV2-012: Bulk Actions Bar Component
- [ ] LV2-013: Bulk Complete with Confirmation
- [ ] LV2-014: Bulk Delete with Confirmation
```

### Week 5-6: Power Features
```bash
# Advanced Operations
- [ ] LV2-015: Bulk Project Assignment
- [ ] LV2-016: Bulk Priority Setting
- [ ] LV2-017: Bulk Label Operations
- [ ] LV2-018: Multi-Task Scheduling Queue

# Context Menu
- [ ] LV2-019: Right-Click Context Menu
- [ ] LV2-020: Touch/Long-Press Support
```

## ⚠️ Critical Rules (Still Apply!)

### 1. Component Reuse (MANDATORY)
```typescript
// ✅ CORRECT: Reuse ALL existing components
import { ListView } from '@/components/ListView/ListView'
import { ProjectOverlay } from '@/components/ProjectSelectionOverlay'
import { useOverlayContext } from '@/hooks/useOverlayContext'

// ❌ WRONG: Creating duplicate components
const MultiListProjectOverlay = () => { /* ... */ }
```

### 2. Follow Dropdown Order
```typescript
// ✅ CORRECT: Use existing queue order logic
const listOrder = processingModeOptions[currentMode].queues

// ❌ WRONG: Hardcoding list order
const lists = ['inbox', 'overdue', 'today', ...]
```

### 3. Single Data Source
```typescript
// ✅ CORRECT: Use masterTasks for all lists
const getTasksForList = (listId) => {
  return masterTasks.filter(/* appropriate filter */)
}

// ❌ WRONG: Separate data per list
const inboxTasks = await fetchInboxTasks()
```

## 🧪 Phase 2 Testing Checklist

After implementing each component:

1. **Multi-List Test**: All lists follow dropdown order exactly
2. **Settings Test**: Preferences persist across sessions
3. **Duplicate Filter Test**: Tasks appear only once when enabled
4. **Performance Test**: Smooth scrolling with many lists
5. **Selection Test**: Multi-select works across lists
6. **Mobile Test**: Lists stack properly on small screens

## 🔍 Phase 2 Quick Reference

### Key Decisions Made

- **List Order**: Follow dropdown order exactly
- **Settings UI**: Gear icon → modal (minimal main UI impact)
- **Empty Lists**: Show "[List Name] has no tasks"
- **Performance**: No limits, load lists as needed
- **Duplicate Filter**: Global setting
- **Multi-Task Schedule**: One-by-one in normal scheduler

### When You Need...

- **Phase 2 tasks** → `03-TASKS/Phase-2-Task-Breakdown.md`
- **Quick decisions** → `Phase-2-Summary.md`
- **Overall progress** → `PROJECT-STATUS.md`
- **Phase 1 reference** → `phase-1/Phase-1-Task-Breakdown.md`

### Common Phase 2 Questions

1. **"How many lists to show?"** → Keep loading as user scrolls
2. **"Where do settings go?"** → Gear icon with modal popup
3. **"How to handle duplicates?"** → Global toggle, show in first list only
4. **"List order?"** → Always follow current dropdown order

## 🎯 Phase 2 Success Criteria

Your implementation is successful when:

- [ ] Multiple lists display in correct order
- [ ] Progressive loading works smoothly
- [ ] Settings persist and work correctly
- [ ] Bulk operations work across lists
- [ ] Performance remains good with many lists
- [ ] Mobile experience is clean

## 💡 Pro Tips for Phase 2

1. **Start with foundation**: Get multi-list container working first
2. **Reuse ListView**: Each list is just a ListView instance
3. **Use Intersection Observer**: For progressive loading
4. **Test with many lists**: Use Projects mode with 20+ projects
5. **Keep it simple**: No smart scheduling yet, just sequential

---

**Ready to start Phase 2?** Open [Phase-2-Task-Breakdown.md](./03-TASKS/Phase-2-Task-Breakdown.md) and begin with LV2-001! 🚀