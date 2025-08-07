import { TodoistTask } from '@/lib/types';
import { ProcessingMode, PRESET_FILTERS } from '@/types/processing-mode';
import { AssigneeFilterType } from '@/components/AssigneeFilter';
import { isExcludedLabel } from '@/lib/excluded-labels';
import { filterTasksByDeadlineOption } from '@/hooks/useDeadlineOptions';
import { filterTasksByDateOption } from '@/hooks/useDateOptions';

// Helper function to detect recurring tasks
function isRecurringTask(task: TodoistTask): boolean {
  if (!task.due) return false;
  
  // Check if the due string contains recurring patterns
  const recurringPatterns = [
    'every',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'weekday',
    'weekend'
  ];
  
  const dueString = task.due.string?.toLowerCase() || '';
  return recurringPatterns.some(pattern => dueString.includes(pattern)) || task.due.recurring === true;
}

export function filterTasksByMode(
  tasks: TodoistTask[],
  mode: ProcessingMode,
  projectMetadata?: Record<string, any>,
  assigneeFilter: AssigneeFilterType = 'all',
  currentUserId?: string
): TodoistTask[] {
  // Always exclude archived tasks (those starting with "* ") and tasks with excluded labels
  let filtered = tasks.filter(task => {
    // Exclude archived tasks
    if (task.content.startsWith('* ')) return false;
    
    // Exclude tasks with any excluded labels
    if (task.labels.some(label => isExcludedLabel(label))) return false;
    
    return true;
  });

  // Apply assignee filter
  if (assigneeFilter !== 'all') {
    filtered = filtered.filter(task => {
      switch (assigneeFilter) {
        case 'unassigned':
          return !task.assigneeId;
        case 'assigned-to-me':
          return task.assigneeId === currentUserId;
        case 'assigned-to-others':
          return task.assigneeId && task.assigneeId !== currentUserId;
        case 'not-assigned-to-others':
          return !task.assigneeId || task.assigneeId === currentUserId;
        default:
          return true;
      }
    });
  }

  switch (mode.type) {
    case 'project':
      return filtered.filter(task => 
        String(task.projectId) === String(mode.value)
      );

    case 'priority':
      const priority = parseInt(mode.value as string);
      return filtered.filter(task => task.priority === priority);

    case 'label':
      // Handle both single string (new) and array (legacy) formats
      const labelValue = mode.value;
      if (!labelValue) return [];
      
      const selectedLabels = Array.isArray(labelValue) ? labelValue : [labelValue as string];
      if (selectedLabels.length === 0) return [];
      
      // OR logic - task must have at least one of the selected labels
      return filtered.filter(task => 
        task.labels.some(label => selectedLabels.includes(label))
      );

    case 'date':
      const dateOption = mode.value as string;
      
      // Special cases not in the filtering function
      if (dateOption === 'scheduled') {
        return filtered.filter(task => !!task.due && !isRecurringTask(task));
      }
      if (dateOption === 'no_date') {
        return filtered.filter(task => !task.due);
      }
      
      // Use the same filtering function as the counting logic
      return filterTasksByDateOption(filtered, dateOption);

    case 'deadline':
      const deadlineOption = mode.value as string;
      
      // Special case for no_deadline which isn't in the filtering function
      if (deadlineOption === 'no_deadline') {
        return filtered.filter(task => !task.deadline);
      }
      
      // Use the same filtering function as the counting logic
      return filterTasksByDeadlineOption(filtered, deadlineOption);

    case 'preset':
      const presetId = mode.value as string;
      const preset = PRESET_FILTERS.find(p => p.id === presetId);
      
      if (!preset) {
        console.warn(`Preset filter ${presetId} not found`);
        return filtered;
      }
      
      // Applying preset filter
      
      const result = filtered.filter(task => {
        try {
          const matches = preset.filter(task, projectMetadata || {});
          if (presetId === 'priority-projects' && matches) {
            const meta = projectMetadata?.[task.projectId];
            // Task matches priority-projects filter
          }
          return matches;
        } catch (error) {
          console.error(`Error applying preset filter ${presetId}:`, error);
          return false;
        }
      });
      
      console.log(`Preset filter ${presetId} matched ${result.length} tasks`);
      return result;

    case 'prioritized':
      // Handle prioritized mode by extracting the actual filter type and value
      try {
        const prioritizedValue = JSON.parse(mode.value as string);
        const { filterType, filterValue } = prioritizedValue;
        
        console.log('[filterTasksByMode] Prioritized mode:', {
          originalMode: mode,
          parsedValue: prioritizedValue,
          filterType,
          filterValue,
          displayName: mode.displayName
        });
        
        // Create a temporary mode with the actual filter type
        const actualMode: ProcessingMode = {
          type: filterType,
          value: filterValue,
          displayName: mode.displayName
        };
        
        // Recursively call filterTasksByMode with the actual mode
        return filterTasksByMode(tasks, actualMode, projectMetadata, assigneeFilter, currentUserId);
      } catch (error) {
        console.error('Error parsing prioritized mode value:', error);
        return filtered;
      }

    case 'all':
      const sortBy = mode.value as string;
      let sorted = [...filtered];
      
      switch (sortBy) {
        case 'oldest':
          sorted.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
            return dateA - dateB;
          });
          break;
          
        case 'newest':
          sorted.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          break;
          
        case 'priority':
          sorted.sort((a, b) => {
            // Higher priority number = higher priority (P1=4, P4=1)
            if (b.priority !== a.priority) {
              return b.priority - a.priority;
            }
            // If same priority, sort by creation date (oldest first)
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
            return dateA - dateB;
          });
          break;
          
        case 'due_date':
          sorted.sort((a, b) => {
            // Tasks without scheduled dates go last
            if (!a.due && !b.due) return 0;
            if (!a.due) return 1;
            if (!b.due) return -1;
            
            const dateA = new Date(a.due.date);
            const dateB = new Date(b.due.date);
            const now = new Date();
            
            // Both overdue - most overdue first
            if (dateA < now && dateB < now) {
              return dateA.getTime() - dateB.getTime();
            }
            
            // One overdue, one not - overdue first
            if (dateA < now) return -1;
            if (dateB < now) return 1;
            
            // Both future - closest first
            return dateA.getTime() - dateB.getTime();
          });
          break;
      }
      
      return sorted;

    default:
      return filtered;
  }
}

export function getActiveTasks(
  tasks: TodoistTask[],
  assigneeFilter: AssigneeFilterType = 'all',
  currentUserId?: string
): TodoistTask[] {
  return tasks.filter(task => {
    // Exclude archived tasks
    if (task.content.startsWith('* ')) return false;
    
    // Exclude tasks with excluded labels
    if (task.labels.some(label => isExcludedLabel(label))) return false;
    
    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      switch (assigneeFilter) {
        case 'unassigned':
          return !task.assigneeId;
        case 'assigned-to-me':
          return task.assigneeId === currentUserId;
        case 'assigned-to-others':
          return task.assigneeId && task.assigneeId !== currentUserId;
        case 'not-assigned-to-others':
          return !task.assigneeId || task.assigneeId === currentUserId;
        default:
          return true;
      }
    }
    
    return true;
  });
}

export function getQueueTaskCount(
  tasks: TodoistTask[],
  mode: ProcessingMode,
  projectMetadata?: Record<string, any>,
  assigneeFilter: AssigneeFilterType = 'all',
  currentUserId?: string
): number {
  const filteredTasks = filterTasksByMode(tasks, mode, projectMetadata, assigneeFilter, currentUserId);
  return filteredTasks.length;
}

export function getTaskCountsForProjects(
  tasks: TodoistTask[],
  projectIds: string[],
  assigneeFilter: AssigneeFilterType = 'all',
  currentUserId?: string
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const projectId of projectIds) {
    counts[projectId] = tasks.filter(task => {
      // Basic filters
      if (String(task.projectId) !== String(projectId)) return false;
      if (task.content.startsWith('* ')) return false;
      
      // Exclude tasks with excluded labels
      if (task.labels.some(label => isExcludedLabel(label))) return false;
      
      // Apply assignee filter
      if (assigneeFilter !== 'all') {
        switch (assigneeFilter) {
          case 'unassigned':
            if (task.assigneeId) return false;
            break;
          case 'assigned-to-me':
            if (task.assigneeId !== currentUserId) return false;
            break;
          case 'assigned-to-others':
            if (!task.assigneeId || task.assigneeId === currentUserId) return false;
            break;
          case 'not-assigned-to-others':
            if (task.assigneeId && task.assigneeId !== currentUserId) return false;
            break;
        }
      }
      
      return true;
    }).length;
  }
  
  return counts;
}