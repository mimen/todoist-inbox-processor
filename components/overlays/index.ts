// Main overlay orchestrator
export { default as OverlayManager } from './OverlayManager'

// Task-modifying overlays
export {
  PriorityOverlay,
  ProjectSelectionOverlay,
  LabelSelectionOverlay,
  AssigneeSelectionOverlay,
  ScheduledDateSelector,
  DeadlineSelector,
  NewTaskOverlay,
  SmartScheduleDateInput,
  TaskSchedulerView
} from './task-overlays'

// UI/UX overlays
export {
  KeyboardShortcuts,
  SettingsModal,
  SyncStatusModal
} from './ui-overlays'