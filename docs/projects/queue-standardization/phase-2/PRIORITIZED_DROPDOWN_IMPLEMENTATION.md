# Prioritized Dropdown Implementation

## Overview
Create a new dropdown type that shows a prioritized list of processing options, combining different modes (project, priority, smart filters) into a single dropdown with a custom order.

## Implementation Approach

### 1. Add New Smart Filters
First, we need to add smart filters that combine scheduled dates and deadlines:

```typescript
// Add to PRESET_FILTERS in types/processing-mode.ts

{
  id: 'overdue-all',
  name: 'Overdue (Schedule or Deadline)',
  description: 'Tasks overdue by scheduled date OR deadline',
  icon: '⏰',
  filter: (task, projectMetadata) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check scheduled date
    if (task.due) {
      const dueDate = new Date(task.due.date);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) return true;
    }
    
    // Check deadline
    if (task.deadline) {
      const deadline = new Date(task.deadline.date);
      deadline.setHours(0, 0, 0, 0);
      if (deadline < today) return true;
    }
    
    return false;
  }
},
{
  id: 'today-all',
  name: 'Today (Schedule or Deadline)',
  description: 'Tasks due today by scheduled date OR deadline',
  icon: '📅',
  filter: (task, projectMetadata) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check scheduled date
    if (task.due) {
      const dueDate = new Date(task.due.date);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate >= today && dueDate < tomorrow) return true;
    }
    
    // Check deadline
    if (task.deadline) {
      const deadline = new Date(task.deadline.date);
      deadline.setHours(0, 0, 0, 0);
      if (deadline >= today && deadline < tomorrow) return true;
    }
    
    return false;
  }
},
{
  id: 'p2-projects',
  name: 'P2 Projects',
  description: 'Tasks in projects marked as P2',
  icon: '📊',
  filter: (task, projectMetadata) => {
    const metadata = projectMetadata[task.projectId];
    return metadata?.priority === 3; // P2
  }
}
```

### 2. Create Prioritized Options Hook

```typescript
// hooks/usePrioritizedOptions.ts
import { useMemo } from 'react'
import { DropdownOption } from '@/types/dropdown'
import { TodoistTask } from '@/lib/types'
import { useProjectOptions } from './useProjectOptions'
import { usePriorityOptions } from './usePriorityOptions'
import { usePresetOptions } from './usePresetOptions'
import { ModeConfig, PrioritizedQueueItem } from '@/types/queue'

export function usePrioritizedOptions(
  tasks: TodoistTask[],
  prioritizedConfig: PrioritizedQueueItem[],
  projectMetadata: any
): DropdownOption[] {
  // Get all available options from existing hooks
  const projectOptions = useProjectOptions(tasks, {}, projectMetadata)
  const priorityOptions = usePriorityOptions(tasks, {})
  const presetOptions = usePresetOptions(tasks, {}, projectMetadata)
  
  return useMemo(() => {
    const options: DropdownOption[] = []
    
    prioritizedConfig.forEach(item => {
      switch (item.type) {
        case 'project':
          // Find specific project
          const project = projectOptions.find(p => p.label === item.value)
          if (project) {
            options.push({
              ...project,
              label: item.name || project.label,
              icon: item.icon || project.icon
            })
          }
          break
          
        case 'priority':
          // Find specific priority
          const priority = priorityOptions.find(p => p.value === item.value)
          if (priority) {
            options.push({
              ...priority,
              label: item.name || priority.label,
              icon: item.icon || priority.icon
            })
          }
          break
          
        case 'preset':
          // Find specific preset filter
          const preset = presetOptions.find(p => p.value === item.value)
          if (preset) {
            options.push({
              ...preset,
              label: item.name || preset.label,
              icon: item.icon || preset.icon
            })
          }
          break
          
        case 'priority-projects':
          // Special case: expand priority projects
          const priorityLevel = parseInt(item.value as string) // 4 for P1, 3 for P2
          const priorityProjects = projectOptions.filter(project => {
            const meta = projectMetadata[project.value]
            return meta?.priority === priorityLevel && project.value !== 'Inbox'
          })
          
          // Add each project as its own option
          priorityProjects.forEach(project => {
            options.push({
              ...project,
              label: `${item.icon || '🔥'} ${project.label}`,
              metadata: {
                ...project.metadata,
                isPriorityProject: true,
                priorityLevel
              }
            })
          })
          break
      }
    })
    
    return options
  }, [tasks, prioritizedConfig, projectOptions, priorityOptions, presetOptions, projectMetadata])
}
```

### 3. Create Prioritized Dropdown Component

```typescript
// components/PrioritizedDropdown.tsx
import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { TodoistTask } from '@/lib/types'
import UnifiedDropdown from './UnifiedDropdown'
import { UnifiedDropdownRef } from '@/types/dropdown'
import { usePrioritizedOptions } from '@/hooks/usePrioritizedOptions'
import { useQueueConfig } from '@/hooks/useQueueConfig'
import { getDropdownConfig } from '@/utils/dropdown-config'

interface PrioritizedDropdownProps {
  selectedValue: string
  onModeChange: (mode: ProcessingMode) => void
  allTasks: TodoistTask[]
  projectMetadata: any
}

const PrioritizedDropdown = forwardRef<any, PrioritizedDropdownProps>(({
  selectedValue,
  onModeChange,
  allTasks,
  projectMetadata
}: PrioritizedDropdownProps, ref) => {
  const dropdownRef = useRef<UnifiedDropdownRef>(null)
  const { config } = useQueueConfig()
  
  const prioritizedOptions = usePrioritizedOptions(
    allTasks,
    config.prioritizedQueue?.sequence || [],
    projectMetadata
  )
  
  const dropdownConfig = getDropdownConfig('prioritized', config, {
    placeholder: 'Select queue...',
    selectionMode: 'single',
    searchable: true
  })

  useImperativeHandle(ref, () => ({
    openDropdown: () => dropdownRef.current?.openDropdown()
  }))

  const handleChange = (value: string | string[], displayName: string) => {
    const selectedOption = prioritizedOptions.find(opt => opt.value === value)
    if (!selectedOption) return
    
    // Determine the processing mode based on the selected option
    let mode: ProcessingMode
    
    if (selectedOption.metadata?.isPriorityProject) {
      // This is a priority project
      mode = {
        type: 'project',
        value: selectedOption.value,
        displayName: selectedOption.label
      }
    } else {
      // Check the original configuration to determine type
      const configItem = config.prioritizedQueue?.sequence.find(
        item => item.value === value || item.name === displayName
      )
      
      if (configItem) {
        mode = {
          type: configItem.type as ProcessingModeType,
          value: configItem.value || value,
          displayName: selectedOption.label
        }
      }
    }
    
    onModeChange(mode)
  }

  return (
    <UnifiedDropdown
      ref={dropdownRef}
      options={prioritizedOptions}
      config={dropdownConfig}
      value={selectedValue}
      onChange={handleChange}
      type="prioritized"
    />
  )
})

PrioritizedDropdown.displayName = 'PrioritizedDropdown'
export default PrioritizedDropdown
```

### 4. JSON Configuration Structure

```json
{
  "prioritizedQueue": {
    "enabled": true,
    "sequence": [
      {
        "type": "project",
        "value": "Inbox",
        "name": "Inbox",
        "icon": "📥"
      },
      {
        "type": "preset",
        "value": "overdue-all",
        "name": "Overdue",
        "icon": "⏰"
      },
      {
        "type": "priority",
        "value": "4",
        "name": "P1 Tasks",
        "icon": "🚨"
      },
      {
        "type": "priority-projects",
        "value": "4",
        "name": "P1 Projects",
        "icon": "🔥"
      },
      {
        "type": "preset",
        "value": "today-all",
        "name": "Today",
        "icon": "📅"
      },
      {
        "type": "priority",
        "value": "3",
        "name": "P2 Tasks",
        "icon": "⚡"
      },
      {
        "type": "priority-projects",
        "value": "3",
        "name": "P2 Projects",
        "icon": "📊"
      }
    ]
  }
}
```

### 5. Type Definitions

```typescript
// types/queue.ts
export interface PrioritizedQueueItem {
  type: 'project' | 'priority' | 'preset' | 'priority-projects'
  value: string
  name: string
  icon?: string
}

export interface PrioritizedQueueConfig {
  enabled: boolean
  sequence: PrioritizedQueueItem[]
}
```

### 6. Integration with ProcessingModeSelector

```typescript
// In ProcessingModeSelector component
import PrioritizedDropdown from './PrioritizedDropdown'

// Add to PROCESSING_MODE_OPTIONS
{
  type: 'prioritized',
  label: 'Queue',
  icon: '📋',
  description: 'Process tasks in prioritized order'
}

// In render logic
{mode.type === 'prioritized' && (
  <PrioritizedDropdown
    selectedValue={mode.value as string}
    onModeChange={onModeChange}
    allTasks={tasks}
    projectMetadata={projectMetadata}
  />
)}
```

## Implementation Steps

1. **Day 1**: Add new smart filters to PRESET_FILTERS
2. **Day 2**: Create usePrioritizedOptions hook with priority project expansion
3. **Day 3**: Create PrioritizedDropdown component
4. **Day 4**: Update ProcessingModeSelector to include new dropdown
5. **Day 5**: Testing and refinement

## Key Features

1. **Reuses Existing Infrastructure**: Leverages UnifiedDropdown and existing option hooks
2. **Priority Project Expansion**: P1/P2 projects show up as individual options
3. **Flexible Configuration**: Easy to reorder or add/remove items via JSON
4. **Consistent UI**: Looks and behaves like other dropdowns

## Testing Approach

1. Verify new smart filters work correctly
2. Test priority project expansion with multiple P1/P2 projects
3. Ensure proper mode switching when selecting different options
4. Test with empty queues and missing data
5. Verify configuration changes update the dropdown