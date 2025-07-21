export interface TodoistTask {
  id: string
  content: string
  description?: string
  projectId: string
  sectionId?: string
  parentId?: string
  order: number
  priority: 1 | 2 | 3 | 4
  labels: string[]
  due?: {
    date: string
    datetime?: string
    string: string
    timezone?: string
    recurring: boolean
  }
  duration?: {
    amount: number
    unit: string
  }
  deadline?: {
    date: string
    datetime?: string
    string: string
    timezone?: string
  }
  url: string
  commentCount: number
  assigneeId?: string
  assignerId?: string
  createdAt: string
  isCompleted: boolean
}

export interface TodoistProject {
  id: string
  name: string
  color: string
  parentId?: string
  order: number
  commentCount: number
  isShared: boolean
  isFavorite: boolean
  isInboxProject: boolean
  isTeamInbox: boolean
  viewStyle: string
  url: string
}

export interface TodoistLabel {
  id: string
  name: string
  color: string
  order: number
  isFavorite: boolean
}

export interface ProcessingState {
  currentTask: TodoistTask | null
  queuedTasks: TodoistTask[]
  processedTasks: string[]
  skippedTasks: string[]
}

export interface TaskUpdate {
  content?: string
  description?: string
  projectId?: string
  priority?: 1 | 2 | 3 | 4
  labels?: string[]
  dueDate?: string
  dueDatetime?: string
  dueString?: string
  duration?: number
  durationUnit?: 'minute' | 'hour'
  deadline?: string
  assigneeId?: string
}

export interface MockAISuggestion {
  type: 'project' | 'label' | 'rewrite' | 'priority' | 'due_date'
  suggestion: string
  confidence: number
  reasoning?: string
}

export interface TodoistUser {
  id: string
  name: string
  email: string
  avatarBig?: string
  avatarMedium?: string
  avatarSmall?: string
}