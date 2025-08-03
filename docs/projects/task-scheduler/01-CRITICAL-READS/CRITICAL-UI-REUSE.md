# CRITICAL: UI Component Reuse Guide

## ⚠️ MUST READ BEFORE IMPLEMENTATION ⚠️

This document outlines the CRITICAL UI components and patterns that MUST be reused for the Task Scheduler implementation.

## Existing Overlay System

### DO NOT CREATE A NEW OVERLAY SYSTEM

The application already has overlay components that MUST be reused:
- `ScheduledDateSelector` component
- `DeadlineSelector` component
- Both use the same overlay pattern and animations

### Integration Points in TaskProcessor

The current implementation uses these overlays:
```typescript
// Current usage in TaskProcessor.tsx
{overlayTask && (
  <ScheduledDateSelector
    currentTask={overlayTask}
    onScheduledDateChange={handleScheduledDateChange}
    onClose={() => {
      setShowScheduledOverlay(false)
      setOverlayTaskId(null)
    }}
    isVisible={showScheduledOverlay}
  />
)}
```

### Required Changes

Replace the internals of `ScheduledDateSelector` and `DeadlineSelector` to use the new Task Scheduler view while maintaining:
- Same props interface
- Same overlay wrapper
- Same animation patterns
- Same keyboard context isolation

## Keyboard Context Pattern

### Existing Pattern
```typescript
// The app already handles keyboard context isolation
useEffect(() => {
  if (!isVisible) return
  
  // Keyboard handling logic here
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isVisible])
```

### Reuse This Pattern
- Don't create new keyboard management systems
- Use the same `isVisible` prop pattern
- Maintain the same event listener approach

## Styling Patterns

### Overlay Styling
```typescript
// Existing overlay classes to reuse
className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
```

### Modal Container
```typescript
// Existing modal container pattern
className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4"
```

### Animation Classes
- Use existing Tailwind animation utilities
- Don't create custom animations
- Maintain consistency with current overlays

## State Management Pattern

### Current Approach
```typescript
const [showScheduledOverlay, setShowScheduledOverlay] = useState(false)
const [overlayTaskId, setOverlayTaskId] = useState<string | null>(null)
```

### Continue This Pattern
- Use the same state variables
- Don't create new state management
- Maintain backward compatibility

## Integration Checklist

Before implementing, ensure you understand:
- [ ] Location of existing overlay components
- [ ] Current props interface
- [ ] Keyboard shortcut triggers ('s' and 'd' keys)
- [ ] Animation and styling patterns
- [ ] State management approach

## Common Mistakes to Avoid

1. **Creating a new overlay component** - Modify existing ones
2. **Changing the props interface** - Keep it identical
3. **Breaking keyboard shortcuts** - 's' and 'd' must still work
4. **Using different animations** - Keep consistency
5. **Changing z-index values** - Use existing ones

## Example Integration

```typescript
// CORRECT: Modify existing component
export default function ScheduledDateSelector({
  currentTask,
  onScheduledDateChange,
  onClose,
  isVisible
}: ExistingProps) {
  // Replace internals with Task Scheduler view
  return (
    <TaskSchedulerView
      mode="scheduled"
      task={currentTask}
      onSelect={onScheduledDateChange}
      onClose={onClose}
      isVisible={isVisible}
    />
  )
}

// INCORRECT: Creating new component
export function NewTaskSchedulerOverlay() { // ❌ Don't do this!
  // ...
}
```

## Summary

The Task Scheduler is NOT a new feature - it's an enhancement of existing date selection overlays. Treat it as such and reuse all existing patterns and components.