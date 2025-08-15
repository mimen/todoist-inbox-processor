export const todoistConfig = {
  apiKey: process.env.TODOIST_API_KEY,
  syncApiUrl: 'https://api.todoist.com/sync/v9/sync',
} as const

// Validate API key is set
if (!todoistConfig.apiKey) {
  throw new Error('TODOIST_API_KEY environment variable is required')
}