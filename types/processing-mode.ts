export type ProcessingModeType = 'project' | 'priority' | 'label' | 'date' | 'filter';

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
    label: 'Date',
    icon: '',
    description: 'Process tasks by due date'
  },
  {
    type: 'filter',
    label: 'Filter',
    icon: '',
    description: 'Use saved Todoist filters'
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
  { value: 'no_date', label: 'No Date', icon: '📭', color: 'text-gray-500' }
];