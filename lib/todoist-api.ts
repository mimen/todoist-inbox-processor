import { TodoistApi } from '@doist/todoist-api-typescript'

// Initialize Todoist API client
const api = new TodoistApi(process.env.TODOIST_API_KEY!)

export interface TodoistTaskApi {
  id: string
  content: string
  description: string
  projectId: string
  priority: 1 | 2 | 3 | 4
  labels: string[]
  due?: {
    date: string
    string: string
    datetime?: string
  }
  deadline?: {
    date: string
    string: string
  }
  createdAt: string
  isCompleted: boolean
}

export interface TodoistProjectApi {
  id: string
  name: string
  color: string
  isInboxProject: boolean
  parentId?: string
}

export interface TodoistLabelApi {
  id: string
  name: string
  color: string
}

export interface TaskUpdateRequest {
  content?: string
  description?: string
  projectId?: string
  priority?: 1 | 2 | 3 | 4
  labels?: string[]
  dueString?: string
  deadline?: string
}

export class TodoistApiClient {
  // Fetch all projects
  static async getProjects(): Promise<TodoistProjectApi[]> {
    try {
      const response = await api.getProjects()
      console.log('Projects response:', response)
      console.log('Projects response type:', typeof response)
      console.log('Projects response keys:', Object.keys(response || {}))
      
      // Handle different response formats
      let projects: any[]
      if (Array.isArray(response)) {
        projects = response
      } else if (response && typeof response === 'object') {
        // Try common pagination field names
        projects = (response as any).data || 
                  (response as any).items || 
                  (response as any).projects ||
                  (response as any).results ||
                  []
      } else {
        projects = []
      }

      console.log('Extracted projects:', projects)
      console.log('Projects array length:', projects.length)

      // Filter out null/undefined items
      const validProjects = projects.filter(project => project && project.id)

      return validProjects.map((project: any) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        isInboxProject: project.inboxProject || false,
        parentId: project.parentId || undefined,
      }))
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw new Error('Failed to fetch projects')
    }
  }

  // Fetch all labels
  static async getLabels(): Promise<TodoistLabelApi[]> {
    try {
      const response = await api.getLabels()
      console.log('Labels response:', response)
      console.log('Labels response keys:', Object.keys(response || {}))
      
      // Handle different response formats
      let labels: any[]
      if (Array.isArray(response)) {
        labels = response
      } else if (response && typeof response === 'object') {
        // Try common pagination field names
        labels = (response as any).data || 
                (response as any).items || 
                (response as any).labels ||
                (response as any).results ||
                []
      } else {
        labels = []
      }

      console.log('Extracted labels:', labels)
      
      // Filter out null/undefined items
      const validLabels = labels.filter(label => label && label.id)

      return validLabels.map((label: any) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      }))
    } catch (error) {
      console.error('Error fetching labels:', error)
      throw new Error('Failed to fetch labels')
    }
  }

  // Fetch active tasks (inbox tasks or all tasks)
  static async getTasks(filter?: string): Promise<TodoistTaskApi[]> {
    try {
      const response = filter ? await api.getTasks({ filter } as any) : await api.getTasks()
      console.log('Tasks response:', response)
      console.log('Tasks response keys:', Object.keys(response || {}))
      
      // Handle different response formats
      let tasks: any[]
      if (Array.isArray(response)) {
        tasks = response
      } else if (response && typeof response === 'object') {
        // Try common pagination field names
        tasks = (response as any).data || 
               (response as any).items || 
               (response as any).tasks ||
               (response as any).results ||
               []
      } else {
        tasks = []
      }

      console.log('Extracted tasks:', tasks)
      
      // Filter out null/undefined items
      const validTasks = tasks.filter(task => task && task.id)

      return validTasks.map((task: any) => ({
        id: task.id,
        content: task.content,
        description: task.description || '',
        projectId: task.projectId,
        priority: task.priority as 1 | 2 | 3 | 4,
        labels: task.labels || [],
        due: task.due ? {
          date: task.due.date,
          string: task.due.string,
          datetime: task.due.datetime || undefined,
        } : undefined,
        deadline: task.deadline ? {
          date: task.deadline.date,
          string: task.deadline.string,
        } : undefined,
        createdAt: task.createdAt,
        isCompleted: task.isCompleted || false,
      }))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw new Error('Failed to fetch tasks')
    }
  }

  // Get inbox tasks specifically
  static async getInboxTasks(): Promise<TodoistTaskApi[]> {
    return this.getTasks()
  }

  // Get tasks for a specific project
  static async getProjectTasks(projectId: string): Promise<TodoistTaskApi[]> {
    try {
      const response = await api.getTasks({ projectId } as any)
      console.log(`Tasks response for project ${projectId}:`, response)
      
      // Handle different response formats
      let tasks: any[]
      if (Array.isArray(response)) {
        tasks = response
      } else if (response && typeof response === 'object') {
        // Try common pagination field names
        tasks = (response as any).data || 
               (response as any).items || 
               (response as any).tasks ||
               (response as any).results ||
               []
      } else {
        tasks = []
      }

      console.log(`Extracted tasks for project ${projectId}:`, tasks)
      
      // Filter out null/undefined items
      const validTasks = tasks.filter(task => task && task.id)

      return validTasks.map((task: any) => ({
        id: task.id,
        content: task.content,
        description: task.description || '',
        projectId: task.projectId,
        priority: task.priority as 1 | 2 | 3 | 4,
        labels: task.labels || [],
        due: task.due ? {
          date: task.due.date,
          string: task.due.string,
          datetime: task.due.datetime || undefined,
        } : undefined,
        deadline: task.deadline ? {
          date: task.deadline.date,
          string: task.deadline.string,
        } : undefined,
        createdAt: task.createdAt,
        isCompleted: task.isCompleted || false,
      }))
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error)
      throw new Error('Failed to fetch project tasks')
    }
  }

  // Move task to a different project using Sync API v9
  static async moveTaskToProject(taskId: string, projectId: string): Promise<boolean> {
    try {
      console.log('🔄 Moving task via Sync API:', { taskId, projectId })
      
      // Generate a unique UUID for the command
      const uuid = crypto.randomUUID()
      
      const response = await fetch('https://api.todoist.com/sync/v9/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: [
            {
              type: 'item_move',
              args: {
                id: taskId,
                project_id: projectId
              },
              uuid: uuid
            }
          ]
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Sync API move failed:', response.status, errorText)
        throw new Error(`Sync API move failed: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ Sync API move result:', result)
      
      // Check if the command was successful
      if (result.sync_status && result.sync_status[uuid] === 'ok') {
        console.log('✅ Task move confirmed successful')
        return true
      } else {
        console.error('❌ Task move failed:', result.sync_status)
        throw new Error(`Task move failed: ${JSON.stringify(result.sync_status)}`)
      }
    } catch (error) {
      console.error('❌ Sync API move error:', error)
      throw error
    }
  }

  // Update a task
  static async updateTask(taskId: string, updates: TaskUpdateRequest): Promise<boolean> {
    try {
      console.log('TodoistApiClient.updateTask called with:', { taskId, updates })
      
      // Handle project move separately using Sync API
      if (updates.projectId && updates.projectId !== '') {
        try {
          const projects = await this.getProjects()
          const targetProject = projects.find(p => p.id === updates.projectId)
          if (!targetProject) {
            console.error('Target project not found:', updates.projectId)
            console.log('Available projects:', projects.map(p => ({ id: p.id, name: p.name })))
            throw new Error(`Project with ID ${updates.projectId} not found`)
          }
          console.log('Target project found:', { id: targetProject.id, name: targetProject.name })
          
          // Use Sync API for project move
          await this.moveTaskToProject(taskId, updates.projectId)
        } catch (moveError) {
          console.error('❌ Project move failed:', moveError)
          throw new Error(`Failed to move task to project: ${moveError}`)
        }
      }
      
      // Handle deadline separately using Sync API
      if (updates.deadline !== undefined) {
        try {
          console.log('🔄 Updating deadline via Sync API:', { taskId, deadline: updates.deadline })
          
          // Generate a unique UUID for the command
          const uuid = crypto.randomUUID()
          
          // Parse natural language date to ISO format
          let deadlineDate = null
          if (updates.deadline) {
            // First try to parse natural language using Todoist's due date parser
            try {
              const parseResponse = await api.addTask({
                content: 'temp',
                dueString: updates.deadline
              })
              if (parseResponse.due) {
                deadlineDate = { date: parseResponse.due.date }
              }
              // Delete the temporary task
              await api.deleteTask(parseResponse.id)
            } catch (parseError) {
              console.error('Failed to parse deadline date:', parseError)
              throw new Error('Invalid deadline date format')
            }
          }
          
          const response = await fetch('https://api.todoist.com/sync/v9/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              commands: [
                {
                  type: 'item_update',
                  args: {
                    id: taskId,
                    deadline: deadlineDate
                  },
                  uuid: uuid
                }
              ]
            }),
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Sync API deadline update failed:', response.status, errorText)
            throw new Error(`Sync API deadline update failed: ${response.status} ${errorText}`)
          }
          
          const result = await response.json()
          console.log('✅ Sync API deadline result:', result)
          
          // Check if the command was successful
          if (result.sync_status && result.sync_status[uuid] === 'ok') {
            console.log('✅ Deadline update confirmed successful')
          } else {
            console.error('❌ Deadline update failed:', result.sync_status)
            throw new Error(`Deadline update failed: ${JSON.stringify(result.sync_status)}`)
          }
        } catch (deadlineError) {
          console.error('❌ Deadline update error:', deadlineError)
          throw new Error(`Failed to update deadline: ${deadlineError}`)
        }
      }
      
      // Build updates object for other fields (excluding projectId and deadline)
      const cleanUpdates: any = {}
      
      if (updates.content !== undefined) cleanUpdates.content = updates.content
      if (updates.description !== undefined) cleanUpdates.description = updates.description
      if (updates.priority !== undefined) cleanUpdates.priority = updates.priority
      if (updates.labels !== undefined) cleanUpdates.labels = updates.labels
      if (updates.dueString !== undefined) cleanUpdates.dueString = updates.dueString
      
      // Only update other fields if there are any
      if (Object.keys(cleanUpdates).length > 0) {
        console.log('📝 Updating task fields:', cleanUpdates)
        const result = await api.updateTask(taskId, cleanUpdates)
        console.log('✅ Update task result:', result)
      } else {
        console.log('ℹ️  No additional fields to update')
      }
      
      return true
    } catch (error) {
      console.error('Error updating task:', error)
      console.error('Full error details:', JSON.stringify(error, null, 2))
      throw new Error('Failed to update task')
    }
  }

  // Close (complete) a task
  static async closeTask(taskId: string): Promise<boolean> {
    try {
      await api.closeTask(taskId)
      return true
    } catch (error) {
      console.error('Error closing task:', error)
      throw new Error('Failed to close task')
    }
  }

  // Create a new task
  static async createTask(content: string, options?: {
    description?: string
    projectId?: string
    priority?: 1 | 2 | 3 | 4
    labels?: string[]
    dueString?: string
  }): Promise<TodoistTaskApi> {
    try {
      const taskData: any = {
        content,
        ...(options?.description && { description: options.description }),
        ...(options?.projectId && { projectId: options.projectId }),
        ...(options?.priority && { priority: options.priority }),
        ...(options?.labels && { labels: options.labels }),
        ...(options?.dueString && { dueString: options.dueString }),
      }
      
      const response = await api.addTask(taskData)
      return {
        id: response.id,
        content: response.content,
        description: response.description || '',
        projectId: response.projectId,
        priority: response.priority as 1 | 2 | 3 | 4,
        labels: response.labels || [],
        due: response.due ? {
          date: response.due.date,
          string: response.due.string,
          datetime: response.due.datetime || undefined
        } : undefined,
        deadline: (response as any).deadline ? {
          date: (response as any).deadline.date,
          string: (response as any).deadline.string,
        } : undefined,
        createdAt: (response as any).createdAt || new Date().toISOString(),
        isCompleted: !!response.completedAt,
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw new Error('Failed to create task')
    }
  }

  // Project description helpers
  static async getProjectDescription(projectId: string): Promise<string | null> {
    try {
      const tasks = await this.getProjectTasks(projectId)
      const descriptionTask = tasks.find(task => 
        task.content.startsWith('* ') && 
        task.labels.includes('project description')
      )
      
      if (descriptionTask) {
        // Remove the '* ' prefix and return the description
        return descriptionTask.content.substring(2).trim()
      }
      
      return null
    } catch (error) {
      console.error('Error fetching project description:', error)
      return null
    }
  }

  static async setProjectDescription(projectId: string, description: string): Promise<boolean> {
    try {
      const tasks = await this.getProjectTasks(projectId)
      const existingDescriptionTask = tasks.find(task => 
        task.content.startsWith('* ') && 
        task.labels.includes('project description')
      )

      if (existingDescriptionTask) {
        // Update existing description task
        await this.updateTask(existingDescriptionTask.id, {
          content: `* ${description}`,
        })
      } else {
        // Create new description task
        await this.createTask(`* ${description}`, {
          projectId,
          labels: ['project description'],
          priority: 1 // P4 (lowest priority) but still appears at top due to * prefix
        })
      }

      return true
    } catch (error) {
      console.error('Error setting project description:', error)
      throw new Error('Failed to set project description')
    }
  }

  // Project hierarchy with descriptions
  static async fetchProjectHierarchyWithDescriptions(): Promise<{
    flat: (TodoistProjectApi & { description: string })[]
    hierarchical: (TodoistProjectApi & { description: string; children: (TodoistProjectApi & { description: string })[] })[]
  }> {
    try {
      // 1. Get all projects
      const projects = await this.getProjects()
      
      // 2. Get descriptions for all projects in parallel
      const projectsWithDescriptions = await Promise.all(
        projects.map(async (project) => {
          const description = await this.getProjectDescription(project.id)
          return {
            ...project,
            description: description || ''
          }
        })
      )
      
      // 3. Build hierarchy map
      const rootProjects = projectsWithDescriptions.filter(p => !p.parentId)
      const childProjects = projectsWithDescriptions.filter(p => p.parentId)
      
      const hierarchy = rootProjects.map(parent => ({
        ...parent,
        children: childProjects.filter(child => child.parentId === parent.id)
      }))
      
      return {
        flat: projectsWithDescriptions,
        hierarchical: hierarchy
      }
    } catch (error) {
      console.error('Error fetching project hierarchy:', error)
      throw new Error('Failed to fetch project hierarchy with descriptions')
    }
  }

  // Generate context for LLM requests
  static async generateTodoistContext(): Promise<{
    projects: (TodoistProjectApi & { description: string })[]
    hierarchy: (TodoistProjectApi & { description: string; children: (TodoistProjectApi & { description: string })[] })[]
    summary: {
      totalProjects: number
      projectsWithDescriptions: number
      rootProjects: number
    }
  }> {
    try {
      const { flat, hierarchical } = await this.fetchProjectHierarchyWithDescriptions()
      
      return {
        projects: flat,
        hierarchy: hierarchical,
        summary: {
          totalProjects: flat.length,
          projectsWithDescriptions: flat.filter(p => p.description.trim()).length,
          rootProjects: hierarchical.length
        }
      }
    } catch (error) {
      console.error('Error generating Todoist context:', error)
      throw new Error('Failed to generate Todoist context')
    }
  }
}