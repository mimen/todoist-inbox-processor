import { TodoistTask, TodoistProject, TodoistLabel, MockAISuggestion } from './types'

// Mock projects data
export const mockProjects: TodoistProject[] = [
  {
    id: '1',
    name: 'Work',
    color: 'blue',
    order: 1,
    commentCount: 0,
    isShared: false,
    isFavorite: true,
    isInboxProject: false,
    isTeamInbox: false,
    viewStyle: 'list',
    url: '',
  },
  {
    id: '2',
    name: 'Personal',
    color: 'green',
    order: 2,
    commentCount: 0,
    isShared: false,
    isFavorite: false,
    isInboxProject: false,
    isTeamInbox: false,
    viewStyle: 'list',
    url: '',
  },
  {
    id: '3',
    name: 'Shopping',
    color: 'orange',
    order: 3,
    commentCount: 0,
    isShared: false,
    isFavorite: false,
    isInboxProject: false,
    isTeamInbox: false,
    viewStyle: 'list',
    url: '',
  },
  {
    id: 'inbox',
    name: 'Inbox',
    color: 'grey',
    order: 0,
    commentCount: 0,
    isShared: false,
    isFavorite: false,
    isInboxProject: true,
    isTeamInbox: false,
    viewStyle: 'list',
    url: '',
  },
]

// Mock labels data
export const mockLabels: TodoistLabel[] = [
  { id: '1', name: 'urgent', color: 'red', order: 1, isFavorite: true },
  { id: '2', name: 'waiting', color: 'yellow', order: 2, isFavorite: false },
  { id: '3', name: 'someday', color: 'grey', order: 3, isFavorite: false },
  { id: '4', name: 'email', color: 'blue', order: 4, isFavorite: false },
  { id: '5', name: 'phone', color: 'green', order: 5, isFavorite: false },
]

// Mock inbox tasks
export const mockInboxTasks: TodoistTask[] = [
  {
    id: '1',
    content: 'call mom about weekend plans',
    projectId: 'inbox',
    order: 1,
    priority: 1,
    labels: [],
    url: '',
    commentCount: 0,
    createdAt: '2024-01-15T10:00:00Z',
    isCompleted: false,
  },
  {
    id: '2',
    content: 'review quarterly budget report',
    description: 'Need to check the Q4 numbers and prepare for the board meeting',
    projectId: 'inbox',
    order: 2,
    priority: 1,
    labels: [],
    url: '',
    commentCount: 0,
    createdAt: '2024-01-15T10:30:00Z',
    isCompleted: false,
  },
  {
    id: '3',
    content: 'buy groceries',
    projectId: 'inbox',
    order: 3,
    priority: 1,
    labels: [],
    url: '',
    commentCount: 0,
    createdAt: '2024-01-15T11:00:00Z',
    isCompleted: false,
  },
  {
    id: '4',
    content: 'fix the broken link on website',
    description: 'Users are reporting 404 error on the contact page',
    projectId: 'inbox',
    order: 4,
    priority: 1,
    labels: [],
    url: '',
    commentCount: 0,
    createdAt: '2024-01-15T11:30:00Z',
    isCompleted: false,
  },
  {
    id: '5',
    content: 'schedule dentist appointment',
    projectId: 'inbox',
    order: 5,
    priority: 1,
    labels: [],
    url: '',
    commentCount: 0,
    createdAt: '2024-01-15T12:00:00Z',
    isCompleted: false,
  },
]

// Mock AI suggestions generator
export function generateMockSuggestions(taskContent: string): MockAISuggestion[] {
  const suggestions: MockAISuggestion[] = []
  const content = taskContent.toLowerCase()

  // Project suggestions
  if (content.includes('call') || content.includes('phone') || content.includes('mom') || content.includes('family')) {
    suggestions.push({
      type: 'project',
      suggestion: 'Personal',
      confidence: 0.85,
      reasoning: 'Personal communication task'
    })
  } else if (content.includes('work') || content.includes('meeting') || content.includes('report') || content.includes('budget')) {
    suggestions.push({
      type: 'project',
      suggestion: 'Work',
      confidence: 0.9,
      reasoning: 'Work-related task'
    })
  } else if (content.includes('buy') || content.includes('shop') || content.includes('groceries')) {
    suggestions.push({
      type: 'project',
      suggestion: 'Shopping',
      confidence: 0.95,
      reasoning: 'Shopping or purchasing task'
    })
  }

  // Label suggestions
  if (content.includes('call') || content.includes('phone')) {
    suggestions.push({
      type: 'label',
      suggestion: 'phone',
      confidence: 0.9,
      reasoning: 'Phone communication required'
    })
  }
  if (content.includes('urgent') || content.includes('asap') || content.includes('important')) {
    suggestions.push({
      type: 'label',
      suggestion: 'urgent',
      confidence: 0.8,
      reasoning: 'Task indicates urgency'
    })
  }

  // Priority suggestions
  if (content.includes('urgent') || content.includes('asap') || content.includes('critical')) {
    suggestions.push({
      type: 'priority',
      suggestion: '4',
      confidence: 0.85,
      reasoning: 'High priority language detected'
    })
  } else if (content.includes('important') || content.includes('deadline')) {
    suggestions.push({
      type: 'priority',
      suggestion: '3',
      confidence: 0.75,
      reasoning: 'Medium-high priority indicated'
    })
  }

  // Task rewrite suggestions
  if (content.length < 30 || !content.includes(' ')) {
    suggestions.push({
      type: 'rewrite',
      suggestion: makeTaskMoreActionable(taskContent),
      confidence: 0.7,
      reasoning: 'Make task more specific and actionable'
    })
  }

  return suggestions
}

function makeTaskMoreActionable(content: string): string {
  const lower = content.toLowerCase()
  
  if (lower.includes('call mom')) {
    return 'Call mom to discuss weekend plans and confirm dinner time'
  } else if (lower.includes('buy groceries')) {
    return 'Go to grocery store and buy milk, bread, eggs, and vegetables for the week'
  } else if (lower.includes('fix') && lower.includes('website')) {
    return 'Investigate and fix the 404 error on website contact page'
  } else if (lower.includes('dentist')) {
    return 'Call dentist office to schedule routine cleaning appointment'
  } else if (lower.includes('review') && lower.includes('budget')) {
    return 'Review Q4 budget report and prepare summary for board meeting'
  }
  
  return `Complete task: ${content} - add specific details and next actions`
}