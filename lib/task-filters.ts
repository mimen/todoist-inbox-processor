import { TodoistTask } from '@/lib/types';
import { ProcessingMode, PRESET_FILTERS } from '@/types/processing-mode';
import { AssigneeFilterType } from '@/components/AssigneeFilter';

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
  // Always exclude archived tasks (those starting with "* ")
  let filtered = tasks.filter(task => !task.content.startsWith('* '));

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
      const selectedLabels = mode.value as string[];
      if (selectedLabels.length === 0) return [];
      
      // OR logic - task must have at least one of the selected labels
      return filtered.filter(task => 
        task.labels.some(label => selectedLabels.includes(label))
      );

    case 'date':
      const dateOption = mode.value as string;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      return filtered.filter(task => {
        switch (dateOption) {
          case 'overdue':
            if (!task.due) return false;
            const dueDate = new Date(task.due.date);
            return dueDate < today;
          
          case 'today':
            if (!task.due) return false;
            return task.due.date === today.toISOString().split('T')[0];
          
          case 'next_7_days':
            if (!task.due) return false;
            const taskDate = new Date(task.due.date);
            return taskDate >= today && taskDate <= nextWeek;
          
          case 'scheduled':
            return !!task.due && !isRecurringTask(task);
          
          case 'recurring':
            return !!task.due && isRecurringTask(task);
          
          case 'no_date':
            return !task.due;
          
          default:
            return false;
        }
      });

    case 'preset':
      const presetId = mode.value as string;
      const preset = PRESET_FILTERS.find(p => p.id === presetId);
      
      if (!preset) {
        console.warn(`Preset filter ${presetId} not found`);
        return filtered;
      }
      
      console.log(`Applying preset filter: ${presetId}`, {
        totalTasks: filtered.length,
        projectMetadataKeys: Object.keys(projectMetadata || {})
      });
      
      const result = filtered.filter(task => {
        try {
          const matches = preset.filter(task, projectMetadata || {});
          if (presetId === 'priority-projects' && matches) {
            const meta = projectMetadata?.[task.projectId];
            console.log(`Task "${task.content}" matches priority-projects:`, {
              projectId: task.projectId,
              projectMetadata: meta,
              taskPriority: task.priority
            });
          }
          return matches;
        } catch (error) {
          console.error(`Error applying preset filter ${presetId}:`, error);
          return false;
        }
      });
      
      console.log(`Preset filter ${presetId} matched ${result.length} tasks`);
      return result;

    default:
      return filtered;
  }
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