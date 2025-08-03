# List View Implementation Guide

## 🚀 Quick Start for Implementation

Welcome! This guide will help you implement the List View feature efficiently. Follow this workflow to avoid common pitfalls and build it right the first time.

## 📋 Pre-Implementation Checklist

Before writing any code, read these documents in order (30 minutes total):

1. **[CRITICAL-UI-REUSE.md](./01-CRITICAL-READS/CRITICAL-UI-REUSE.md)** (5 min) - MANDATORY: Component reuse rules
2. **[FINAL-IMPLEMENTATION-SUMMARY.md](./01-CRITICAL-READS/FINAL-IMPLEMENTATION-SUMMARY.md)** (10 min) - Key decisions and requirements
3. **[IMPLEMENTATION_PLAN.md](./02-PLANNING/IMPLEMENTATION_PLAN.md)** (5 min) - Understand the phases
4. **[Engineering-Feedback-Summary.md](./01-CRITICAL-READS/Engineering-Feedback-Summary.md)** (10 min) - Critical warnings from code review

## 🎯 Implementation Workflow

### Daily Process

1. **Start Here**: Open [Task-Breakdown.md](./03-TASKS/Task-Breakdown.md)
2. **Find Your Task**: Look for the next unimplemented task (e.g., LV-001)
3. **Get Details**: 
   - Technical details → [Technical-Spec.md](./04-SPECIFICATIONS/Technical-Spec.md)
   - Component code → [Component-Templates.md](./05-CODE-TEMPLATES/Component-Templates.md)
   - Step-by-step → [Implementation-Guide.md](./05-CODE-TEMPLATES/Implementation-Guide.md)

### Document Usage Flow

```
┌─────────────────────┐
│  Task-Breakdown.md  │ ← Start here daily
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Technical-Spec.md   │ ← What to build
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Component-Templates  │ ← Copy starter code
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│Implementation-Guide │ ← How to integrate
└─────────────────────┘

Always check: CRITICAL-UI-REUSE.md
```

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
│   └── Task-Breakdown.md        # All tasks with dependencies
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
└── IMPLEMENTATION-README.md     # You are here
```

## 🏃 Implementation Phases

### Week 1: Foundation (Start Here)
```bash
# Day 1-2: State Management & View Toggle
- [ ] LV-001: ViewMode Types (2 pts)
- [ ] LV-002: TaskProcessor State (3 pts)
- [ ] LV-003: ViewModeToggle Component (3 pts)
- [ ] LV-004: Integrate Toggle (2 pts)

# Day 3-5: Basic List View
- [ ] LV-005: ListView Container (3 pts)
- [ ] LV-006: ListView Integration (2 pts)
- [ ] LV-007: TaskListItem Component (5 pts)
- [ ] LV-025: Verify Overlay Reuse (2 pts) ← CRITICAL!
```

### Week 2: Core Features
```bash
# Sorting, Grouping, Navigation
- [ ] LV-009: Context Display Logic (3 pts)
- [ ] LV-011: Sort Functionality (3 pts)
- [ ] LV-013: Keyboard Navigation (4 pts)
- [ ] LV-014: Grouping UI (4 pts)
```

### Week 3: Performance & Polish
```bash
# Virtual Scrolling & Infinite Scroll
- [ ] LV-018: Virtual Scrolling (5 pts)
- [ ] LV-019: Queue Infinite Scroll (5 pts)
- [ ] LV-020: Mobile Responsive (3 pts)
```

## ⚠️ Critical Rules

### 1. Component Reuse (MANDATORY)
```typescript
// ✅ CORRECT: Reuse existing overlays
import { ProjectOverlay } from '@/components/overlays/ProjectOverlay';
import { useOverlayContext } from '@/contexts/OverlayContext';

// ❌ WRONG: Creating new overlay
const CustomProjectMenu = () => { /* ... */ };
```

### 2. No Column Layout
```typescript
// ✅ CORRECT: Todoist-style inline
<div className="flex items-center gap-2">
  <TaskContent /><PriorityBadge /><ProjectBadge />
</div>

// ❌ WRONG: Table/columns
<td>{task.content}</td><td>{task.priority}</td>
```

### 3. All Data in Memory
```typescript
// ✅ CORRECT: Use existing masterTasks
const tasks = masterTasks.filter(/* ... */);

// ❌ WRONG: New API calls
const tasks = await fetch('/api/tasks/paginated');
```

## 🧪 Testing Checklist

After implementing each component:

1. **Overlay Test**: Make a style change to a shared overlay → verify it appears in BOTH views
2. **Keyboard Test**: All shortcuts work identically in both views
3. **Performance Test**: Smooth scrolling with 500+ tasks
4. **Mobile Test**: Clean layout on phone screens

## 🔍 Quick Reference

### When You Need...

- **Task details** → `03-TASKS/Task-Breakdown.md`
- **Component structure** → `05-CODE-TEMPLATES/Component-Templates.md`
- **What metadata to show** → `04-SPECIFICATIONS/Technical-Spec.md#context-aware-display-logic`
- **Overlay integration** → `04-SPECIFICATIONS/Technical-Spec.md#overlay-integration-critical`
- **Performance approach** → `04-SPECIFICATIONS/Technical-Spec.md#virtual-scrolling-implementation`

### Common Issues

1. **"Should I create a new overlay?"** → NO! See `CRITICAL-UI-REUSE.md`
2. **"How should tasks look?"** → Todoist-style inline, see `Technical-Spec.md#todoist-style-inline-layout`
3. **"Do I need pagination?"** → NO! All data in memory, see `FINAL-IMPLEMENTATION-SUMMARY.md`

## 🎯 Success Criteria

Your implementation is successful when:

- [ ] Both views feel like the same app
- [ ] Any UI change affects both views
- [ ] Virtual scrolling kicks in at >100 tasks
- [ ] Users can toggle between views seamlessly
- [ ] All keyboard shortcuts work identically

## 💡 Pro Tips

1. **Keep open while coding**: `CRITICAL-UI-REUSE.md` checklist
2. **Use task numbers in commits**: "feat: implement view toggle (LV-003)"
3. **Test in both views**: After every change, verify both views still work
4. **Start simple**: Get basic list working before virtual scrolling

---

**Ready to start?** Open [Task-Breakdown.md](./03-TASKS/Task-Breakdown.md) and begin with LV-001! 🚀