/**
 * View mode types for the List View feature
 * These types manage the state and configuration of the new List View
 */

/**
 * The current view mode of the application
 * - 'processing': Traditional single-task processing view
 * - 'list': New list view showing all tasks in current queue
 */
export type ViewMode = 'processing' | 'list';

/**
 * Sorting options for the list view
 * - 'default': Original order from Todoist
 * - 'priority': Sort by priority (highest first)
 * - 'dueDate': Sort by due date (earliest first)
 * - 'createdAt': Sort by creation date (newest first)
 * - 'alphabetical': Sort by task content alphabetically
 */
export type ListViewSortOption = 'default' | 'priority' | 'dueDate' | 'createdAt' | 'alphabetical';

/**
 * Grouping options for the list view
 * - 'none': No grouping, flat list
 * - 'project': Group by project
 * - 'priority': Group by priority level
 * - 'dueDate': Group by due date
 * - 'label': Group by labels
 */
export type GroupOption = 'none' | 'project' | 'priority' | 'dueDate' | 'label';

/**
 * Display context for hiding redundant information
 * Used to intelligently hide metadata that's already shown in the context
 */
export interface DisplayContext {
  /** Hide project badges when viewing tasks from a single project */
  isProjectContext: boolean;
  /** Hide priority when tasks are grouped by priority */
  isPriorityContext: boolean;
  /** Highlight specific labels when filtering by labels */
  isLabelContext: boolean;
  /** Labels to highlight when in label context */
  highlightedLabels?: string[];
}

/**
 * Complete state for the list view
 * Manages all UI state specific to the list view mode
 */
export interface ListViewState {
  /** Set of task IDs with expanded descriptions */
  expandedDescriptions: Set<string>;
  /** Currently selected task IDs for bulk operations (future) */
  selectedTaskIds: Set<string>;
  /** Task ID that has keyboard focus */
  highlightedTaskId: string | null;
  /** Task ID being edited inline */
  editingTaskId: string | null;
  /** Current sort option */
  sortBy: ListViewSortOption;
  /** Current grouping option */
  groupBy: GroupOption;
  /** Scroll position to restore when switching back to list view */
  scrollPosition: number;
  /** Set of collapsed group IDs (for grouped views) */
  collapsedGroups: Set<string>;
}

/**
 * Task group for grouped list views
 * Represents a group of tasks with a common attribute
 */
export interface TaskGroup {
  /** Unique identifier for the group */
  id: string;
  /** Display title for the group header */
  title: string;
  /** Tasks in this group */
  tasks: any[]; // Will be TodoistTask[] when we import it
  /** Whether this group is collapsed */
  isCollapsed?: boolean;
  /** Additional metadata for the group */
  metadata?: {
    priority?: number;
    projectId?: string;
    labelNames?: string[];
    dueDate?: string;
  };
}

/**
 * Configuration for virtual scrolling
 * Used when task count exceeds performance threshold
 */
export interface VirtualScrollConfig {
  /** Height of each task row in pixels */
  itemHeight: number;
  /** Height of expanded task row with description */
  expandedItemHeight: number;
  /** Height of group headers */
  groupHeaderHeight: number;
  /** Number of items to render outside visible area */
  overscan: number;
  /** Threshold for enabling virtual scrolling */
  enableThreshold: number;
}

/**
 * Queue scroll state for infinite scroll feature
 * Manages loading tasks from multiple queues
 */
export interface QueueScrollState {
  /** Queue IDs that have been loaded */
  loadedQueues: string[];
  /** Whether we're currently loading the next queue */
  isLoadingNextQueue: boolean;
  /** Whether there are more queues to load */
  hasMoreQueues: boolean;
  /** Map of queue boundaries for navigation */
  queueBoundaries: Map<string, { start: number; end: number }>;
}

/**
 * Default virtual scroll configuration
 */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  itemHeight: 36, // Todoist-style compact rows
  expandedItemHeight: 120, // With description visible
  groupHeaderHeight: 32,
  overscan: 5,
  enableThreshold: 100
};

/**
 * Default list view state factory
 */
export const createDefaultListViewState = (): ListViewState => ({
  expandedDescriptions: new Set(),
  selectedTaskIds: new Set(),
  highlightedTaskId: null,
  editingTaskId: null,
  sortBy: 'default',
  groupBy: 'none',
  scrollPosition: 0,
  collapsedGroups: new Set()
});

/**
 * Get display context from processing mode
 * Determines what metadata should be hidden based on current view context
 */
export function getDisplayContext(mode: { type: string; value: string | string[] }): DisplayContext {
  switch (mode.type) {
    case 'project':
      // Hide project info when viewing single project
      return {
        isProjectContext: !Array.isArray(mode.value) || mode.value.length === 1,
        isPriorityContext: false,
        isLabelContext: false
      };
    
    case 'priority':
      // Priority is shown in grouping header
      return {
        isProjectContext: false,
        isPriorityContext: true,
        isLabelContext: false
      };
    
    case 'label':
      // Highlight filtered labels
      return {
        isProjectContext: false,
        isPriorityContext: false,
        isLabelContext: true,
        highlightedLabels: Array.isArray(mode.value) ? mode.value : [mode.value]
      };
    
    default:
      // Show all context
      return {
        isProjectContext: false,
        isPriorityContext: false,
        isLabelContext: false
      };
  }
}