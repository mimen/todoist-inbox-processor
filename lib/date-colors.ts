/**
 * Todoist-style date color system
 * Provides consistent colors for dates across the application
 */

export interface DateColorInfo {
  text: string;
  bg: string;
  border: string;
}

/**
 * Get the appropriate color for a date based on Todoist's conventions
 * @param dateString - ISO date string
 * @param isDeadline - Whether this is a deadline (uses more urgent colors)
 * @returns Color classes
 */
export function getDateColor(dateString: string | undefined, isDeadline: boolean = false): DateColorInfo {
  if (!dateString) {
    return {
      text: 'text-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200'
    };
  }

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Overdue
  if (diffDays < 0) {
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    };
  }
  
  // Today
  if (diffDays === 0) {
    return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    };
  }
  
  // Tomorrow
  if (diffDays === 1) {
    return {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    };
  }
  
  // Next 7 days
  if (diffDays <= 7) {
    return {
      text: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    };
  }
  
  // Future
  return {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  };
}

/**
 * Get a human-readable label for a date
 */
export function getDateLabel(dateString: string | undefined): string {
  if (!dateString) return 'No date';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Handle overdue dates
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === -2) return '2 days ago';
  if (diffDays > -7 && diffDays < -2) return `${Math.abs(diffDays)} days ago`;
  if (diffDays >= -14 && diffDays <= -7) return 'Last week';
  if (diffDays < -14 && diffDays >= -30) return `${Math.floor(Math.abs(diffDays) / 7)} weeks ago`;
  if (diffDays < -30) return `${Math.floor(Math.abs(diffDays) / 30)} months ago`;
  
  // Today and tomorrow
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  
  // Within the next week - show day name
  if (diffDays > 1 && diffDays <= 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[date.getDay()];
  }
  
  // Next week
  if (diffDays > 7 && diffDays <= 14) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Next ${dayNames[date.getDay()]}`;
  }
  
  // Within current year - show month and day
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Different year - show full date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get a human-readable label for a date with time if it has a specific time
 */
export function getDateTimeLabel(dateString: string | undefined, includeTime: boolean = true): string {
  if (!dateString) return 'No date';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // For overdue dates, just show the relative date without time
  if (diffDays < 0) {
    return getDateLabel(dateString);
  }
  
  const dateLabel = getDateLabel(dateString);
  const originalDate = new Date(dateString);
  
  // Check if the date has a specific time (not midnight)
  const hasTime = includeTime && (originalDate.getHours() !== 0 || originalDate.getMinutes() !== 0);
  
  if (hasTime) {
    const timeString = originalDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: originalDate.getMinutes() !== 0 ? '2-digit' : undefined,
      hour12: true 
    });
    return `${dateLabel} at ${timeString}`;
  }
  
  return dateLabel;
}

/**
 * Get the full date and time for tooltips
 */
export function getFullDateTime(dateString: string | undefined): string {
  if (!dateString) return 'No date set';
  
  const date = new Date(dateString);
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  
  if (hasTime) {
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: date.getMinutes() !== 0 ? '2-digit' : undefined,
      hour12: true
    });
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Color scheme for date options in dropdowns
 */
export const DATE_OPTION_COLORS = {
  overdue: { text: 'text-red-600', bg: 'bg-red-50', icon: '⏰' },
  today: { text: 'text-blue-600', bg: 'bg-blue-50', icon: '📅' },
  tomorrow: { text: 'text-amber-600', bg: 'bg-amber-50', icon: '☀️' },
  next_7_days: { text: 'text-purple-600', bg: 'bg-purple-50', icon: '📆' },
  scheduled: { text: 'text-gray-600', bg: 'bg-gray-50', icon: '🗓️' },
  recurring: { text: 'text-indigo-600', bg: 'bg-indigo-50', icon: '🔄' },
  no_date: { text: 'text-gray-400', bg: 'bg-gray-50', icon: '📭' }
};

/**
 * Color scheme for deadline options in dropdowns
 */
export const DEADLINE_OPTION_COLORS = {
  overdue: { text: 'text-red-600', bg: 'bg-red-50', icon: '🚨' },
  today: { text: 'text-blue-600', bg: 'bg-blue-50', icon: '🎯' },
  next_7_days: { text: 'text-purple-600', bg: 'bg-purple-50', icon: '📍' },
  upcoming: { text: 'text-gray-600', bg: 'bg-gray-50', icon: '🔥' },
  no_deadline: { text: 'text-gray-400', bg: 'bg-gray-50', icon: '📋' }
};