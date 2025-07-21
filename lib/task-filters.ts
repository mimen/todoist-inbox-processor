import { TodoistTask } from '@/lib/types';
import { ProcessingMode } from '@/types/processing-mode';

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
  mode: ProcessingMode
): TodoistTask[] {
  // Always exclude archived tasks (those starting with "* ")
  let filtered = tasks.filter(task => !task.content.startsWith('* '));

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

    case 'filter':
      // For now, return all non-archived tasks
      // TODO: Implement Todoist filter query parsing
      console.warn('Todoist filter queries not yet implemented');
      return filtered;

    default:
      return filtered;
  }
}

export function getTaskCountsForProjects(
  tasks: TodoistTask[],
  projectIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const projectId of projectIds) {
    counts[projectId] = tasks.filter(task => 
      String(task.projectId) === String(projectId) && 
      !task.content.startsWith('* ')
    ).length;
  }
  
  return counts;
}