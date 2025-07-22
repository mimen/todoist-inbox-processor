export type ProcessingModeType = 'project' | 'priority' | 'label' | 'date' | 'deadline' | 'preset' | 'all';

export interface ProcessingMode {
  type: ProcessingModeType;
  value: string | string[];
  displayName: string;
}

export interface ProcessingModeOption {
  type: ProcessingModeType;
  label: string;
  icon: string;
  description: string;
}

export const PROCESSING_MODE_OPTIONS: ProcessingModeOption[] = [
  {
    type: 'project',
    label: 'Project',
    icon: '',
    description: 'Process tasks by project'
  },
  {
    type: 'priority',
    label: 'Priority',
    icon: '',
    description: 'Process tasks by priority level'
  },
  {
    type: 'label',
    label: 'Label',
    icon: '',
    description: 'Process tasks by label'
  },
  {
    type: 'date',
    label: 'Due Date',
    icon: '',
    description: 'Process tasks by due date'
  },
  {
    type: 'deadline',
    label: 'Deadline',
    icon: '',
    description: 'Process tasks by deadline'
  },
  {
    type: 'preset',
    label: 'Smart Filter',
    icon: '',
    description: 'Use smart preset filters'
  },
  {
    type: 'all',
    label: 'All Tasks',
    icon: '',
    description: 'View all tasks with sorting options'
  }
];

export const PRIORITY_LEVELS = [
  { value: '4', label: 'Priority 1', icon: '🚩', color: 'text-red-500', bgColor: 'bg-red-500' },
  { value: '3', label: 'Priority 2', icon: '🚩', color: 'text-orange-500', bgColor: 'bg-orange-500' },
  { value: '2', label: 'Priority 3', icon: '🚩', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  { value: '1', label: 'Priority 4', icon: '🏳️', color: 'text-gray-400', bgColor: 'bg-gray-400' }
];

export const DATE_OPTIONS = [
  { value: 'overdue', label: 'Overdue', icon: '⏰', color: 'text-red-500' },
  { value: 'today', label: 'Today', icon: '📅', color: 'text-blue-500' },
  { value: 'next_7_days', label: 'Next 7 Days', icon: '📆', color: 'text-green-500' },
  { value: 'scheduled', label: 'Scheduled (One-time)', icon: '🗓️', color: 'text-purple-500' },
  { value: 'recurring', label: 'Scheduled (Recurring)', icon: '🔄', color: 'text-indigo-500' },
  { value: 'no_date', label: 'No Due Date', icon: '📭', color: 'text-gray-500' }
];

export const DEADLINE_OPTIONS = [
  { value: 'overdue', label: 'Overdue', icon: '⚠️', color: 'text-red-500' },
  { value: 'today', label: 'Today', icon: '🎯', color: 'text-red-600' },
  { value: 'next_7_days', label: 'Next 7 Days', icon: '📍', color: 'text-orange-500' },
  { value: 'upcoming', label: 'Upcoming', icon: '🔥', color: 'text-yellow-500' },
  { value: 'no_deadline', label: 'No Deadline', icon: '📋', color: 'text-gray-500' }
];

export interface PresetFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
  filter: (task: any, projectMetadata: any) => boolean;
}

export const PRESET_FILTERS: PresetFilter[] = [
  {
    id: 'daily-planning',
    name: 'Daily Planning',
    description: 'Priority 1 tasks, due today, or overdue',
    icon: '🎯',
    filter: (task, projectMetadata) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // P1 task
      if (task.priority === 4) return true;
      
      // Due today or overdue
      if (task.due) {
        const dueDate = new Date(task.due.date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      }
      
      return false;
    }
  },
  {
    id: 'priority-projects',
    name: 'Priority Projects',
    description: 'Tasks in projects marked as P1',
    icon: '🔥',
    filter: (task, projectMetadata) => {
      const metadata = projectMetadata[task.projectId];
      return metadata?.priority === 4; // P1
    }
  },
  {
    id: 'due-projects',
    name: 'Due Projects',
    description: 'Tasks in projects due this week',
    icon: '📊',
    filter: (task, projectMetadata) => {
      const metadata = projectMetadata[task.projectId];
      if (!metadata?.due) return false;
      
      const projectDue = new Date(metadata.due.date);
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      return projectDue >= today && projectDue <= nextWeek;
    }
  }
];

export const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest First', description: 'Show the oldest tasks first' },
  { value: 'newest', label: 'Newest First', description: 'Show the newest tasks first' },
  { value: 'priority', label: 'Priority', description: 'Sort by priority (P1 first)' },
  { value: 'due_date', label: 'Due Date', description: 'Sort by due date (overdue first)' }
];