import { TodoistApi } from '@doist/todoist-api-typescript'
import crypto from 'crypto'
import { TodoistTask } from './types'

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
    responsibleUid?: string | null
    isCompleted: boolean
}

// Transform API task to app task format
export function transformApiTaskToAppTask(apiTask: TodoistTaskApi): TodoistTask {
    return {
        id: apiTask.id,
        content: apiTask.content,
        description: apiTask.description || undefined,
        projectId: apiTask.projectId,
        sectionId: undefined,
        parentId: undefined,
        order: 0,
        priority: apiTask.priority,
        labels: apiTask.labels,
        due: apiTask.due ? {
            date: apiTask.due.date,
            string: apiTask.due.string,
            datetime: apiTask.due.datetime,
            recurring: false
        } : undefined,
        duration: undefined,
        deadline: apiTask.deadline,
        url: `https://todoist.com/app/task/${apiTask.id}`,
        commentCount: 0,
        assigneeId: apiTask.responsibleUid ? String(apiTask.responsibleUid) : undefined,
        createdAt: apiTask.createdAt,
        isCompleted: apiTask.isCompleted
    }
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
    assigneeId?: string
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
                projects =
                    (response as any).data ||
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
            const validProjects = projects.filter((project) => project && project.id)

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
                labels =
                    (response as any).data ||
                    (response as any).items ||
                    (response as any).labels ||
                    (response as any).results ||
                    []
            } else {
                labels = []
            }

            console.log('Extracted labels:', labels)

            // Filter out null/undefined items
            const validLabels = labels.filter((label) => label && label.id)

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

    // Fetch active tasks using REST API with filter support
    static async getTasks(filter?: string): Promise<TodoistTaskApi[]> {
        try {
            if (!filter) {
                // If no filter, use Sync API to get all tasks
                return await TodoistApiClient.getAllTasksSync()
            }
            
            // Use REST API v2 directly with filter parameter
            console.log('Fetching tasks with filter:', filter)
            const apiKey = process.env.TODOIST_API_KEY
            if (!apiKey) {
                throw new Error('TODOIST_API_KEY is not configured')
            }
            
            // Fetch from REST API v2 with filter
            const response = await fetch(`https://api.todoist.com/rest/v2/tasks?${new URLSearchParams({ filter })}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            })
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`)
            }
            
            const tasks = await response.json()
            
            console.log(`Filter query returned ${tasks.length} tasks`)
            
            // Convert to our format
            return tasks.map((task: any) => ({
                id: task.id,
                content: task.content,
                description: task.description || '',
                projectId: String(task.projectId),
                priority: task.priority as 1 | 2 | 3 | 4,
                labels: task.labels || [],
                due: task.due ? {
                    date: task.due.date,
                    string: task.due.string,
                    datetime: task.due.datetime || undefined,
                    recurring: task.due.recurring || false
                } : undefined,
                deadline: task.deadline ? {
                    date: task.deadline.date,
                    string: task.deadline.string
                } : undefined,
                createdAt: task.created_at || task.createdAt || task.added_at || new Date().toISOString(),
                responsibleUid: task.responsibleUid || null,
                isCompleted: task.isCompleted || false
            }))
        } catch (error) {
            console.error('Error fetching tasks with filter:', error)
            throw new Error('Failed to fetch filtered tasks')
        }
    }

    // Get inbox tasks specifically
    static async getInboxTasks(): Promise<TodoistTaskApi[]> {
        try {
            // First get all projects to find the inbox
            const projects = await TodoistApiClient.getProjectsSync()
            const inboxProject = projects.find(p => p.isInboxProject)
            
            if (!inboxProject) {
                console.error('Inbox project not found')
                return []
            }
            
            // Get all tasks and filter for inbox
            const allTasks = await TodoistApiClient.getAllTasksSync()
            return allTasks.filter(task => task.projectId === String(inboxProject.id))
        } catch (error) {
            console.error('Error fetching inbox tasks:', error)
            throw new Error('Failed to fetch inbox tasks')
        }
    }

    // Get ALL projects using Sync API (to ensure consistent IDs with tasks)
    static async getProjectsSync(): Promise<TodoistProjectApi[]> {
        try {
            const apiKey = process.env.TODOIST_API_KEY
            if (!apiKey) {
                throw new Error('TODOIST_API_KEY is not configured')
            }

            // Use sync API to get all projects
            const response = await fetch('https://api.todoist.com/sync/v9/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    sync_token: '*',
                    resource_types: ['projects'],
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Sync API error:', errorText)
                throw new Error(`Sync API request failed: ${response.status}`)
            }

            const result = await response.json()
            console.log(
                'Sync API projects response received, projects count:',
                result.projects?.length || 0,
            )

            // Convert sync API projects to our format
            const projects = result.projects || []

            return projects
                .filter((project: any) => !project.is_deleted)
                .map((project: any) => ({
                    id: String(project.id), // Numeric ID from sync API
                    name: project.name,
                    color: project.color,
                    parentId: project.parent_id ? String(project.parent_id) : undefined,
                    isInboxProject: project.inbox_project || false,
                    order: project.child_order || 0,
                }))
        } catch (error) {
            console.error('Error fetching projects via Sync API:', error)
            // Fallback to regular API
            return TodoistApiClient.getProjects()
        }
    }

    // Get ALL tasks using Sync API (more efficient for large datasets)
    static async getAllTasksSync(): Promise<TodoistTaskApi[]> {
        try {
            const apiKey = process.env.TODOIST_API_KEY
            if (!apiKey) {
                throw new Error('TODOIST_API_KEY is not configured')
            }

            // Use sync API to get all items in one request
            const response = await fetch('https://api.todoist.com/sync/v9/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    sync_token: '*',
                    resource_types: ['items'],
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Sync API error:', errorText)
                throw new Error(`Sync API request failed: ${response.status}`)
            }

            const result = await response.json()
            console.log('Sync API response received, items count:', result.items?.length || 0)

            // Convert sync API items to our task format
            const items = result.items || []

            // Filter out completed tasks and convert to our format
            const activeTasks = items
                .filter((item: any) => !item.is_deleted && !item.checked)
                .map((item: any) => ({
                    id: item.id,
                    content: item.content,
                    description: item.description || '',
                    projectId: String(item.project_id), // Ensure string type for consistency
                    priority: item.priority as 1 | 2 | 3 | 4, // Sync API uses 1-4 where 1 is natural (p4), 4 is urgent (p1)
                    labels: item.labels || [],
                    due: item.due
                        ? {
                              date: item.due.date,
                              string: item.due.string,
                              datetime: item.due.datetime || undefined,
                          }
                        : undefined,
                    deadline: item.deadline
                        ? {
                              date: item.deadline.date,
                              string: item.deadline.string,
                          }
                        : undefined,
                    responsibleUid: item.responsible_uid || null,
                    isCompleted: false,
                    createdAt: item.added_at || new Date().toISOString(),
                }))

            console.log(
                `Sync API: Fetched ${activeTasks.length} active tasks from ${items.length} total items`,
            )
            return activeTasks
        } catch (error) {
            console.error('Error fetching all tasks via Sync API:', error)
            throw new Error('Failed to fetch all tasks via Sync API')
        }
    }

    // Get tasks for a specific project
    static async getProjectTasks(projectId: string): Promise<TodoistTaskApi[]> {
        try {
            console.log(`getProjectTasks called with projectId: ${projectId} (type: ${typeof projectId})`)
            
            // The REST API expects a string project ID, not numeric
            const response = await api.getTasks({ projectId: projectId } as any)
            console.log(`Tasks response for project ${projectId}:`, response)

            // Handle different response formats
            let tasks: any[]
            if (Array.isArray(response)) {
                tasks = response
            } else if (response && typeof response === 'object') {
                // Try common pagination field names
                tasks =
                    (response as any).data ||
                    (response as any).items ||
                    (response as any).tasks ||
                    (response as any).results ||
                    []
            } else {
                tasks = []
            }

            console.log(`Extracted tasks for project ${projectId}:`, tasks)

            // Filter out null/undefined items
            const validTasks = tasks.filter((task) => task && task.id)
            

            return validTasks.map((task: any) => ({
                id: task.id,
                content: task.content,
                description: task.description || '',
                projectId: String(task.projectId),
                priority: task.priority as 1 | 2 | 3 | 4,
                labels: task.labels || [],
                due: task.due
                    ? {
                          date: task.due.date,
                          string: task.due.string,
                          datetime: task.due.datetime || undefined,
                      }
                    : undefined,
                deadline: task.deadline
                    ? {
                          date: task.deadline.date,
                          string: task.deadline.string,
                      }
                    : undefined,
                createdAt: task.created_at || task.createdAt || task.added_at || new Date().toISOString(),
                responsibleUid: task.responsibleUid || null,
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
                    Authorization: `Bearer ${process.env.TODOIST_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    commands: [
                        {
                            type: 'item_move',
                            args: {
                                id: taskId,
                                project_id: projectId,
                            },
                            uuid: uuid,
                        },
                    ],
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
                    // Use getProjectsSync to ensure consistent IDs with Sync API
                    const projects = await TodoistApiClient.getProjectsSync()
                    const targetProject = projects.find((p) => String(p.id) === String(updates.projectId))
                    if (!targetProject) {
                        console.error('Target project not found:', updates.projectId)
                        console.log(
                            'Available projects:',
                            projects.map((p) => ({ id: p.id, name: p.name })),
                        )
                        throw new Error(`Project with ID ${updates.projectId} not found`)
                    }
                    console.log('Target project found:', {
                        id: targetProject.id,
                        name: targetProject.name,
                    })

                    // Use Sync API for project move - ensure we pass the numeric ID as string
                    await TodoistApiClient.moveTaskToProject(taskId, String(targetProject.id))
                } catch (moveError) {
                    console.error('❌ Project move failed:', moveError)
                    throw new Error(`Failed to move task to project: ${moveError}`)
                }
            }

            // Handle deadline separately using Sync API
            if (updates.deadline !== undefined) {
                try {
                    console.log('🔄 Updating deadline via Sync API:', {
                        taskId,
                        deadline: updates.deadline,
                    })

                    // Generate a unique UUID for the command
                    const uuid = crypto.randomUUID()

                    // Parse natural language date to ISO format
                    let deadlineDate = null
                    if (updates.deadline) {
                        // First try to parse natural language using Todoist's do date parser
                        try {
                            const parseResponse = await api.addTask({
                                content: 'temp',
                                dueString: updates.deadline,
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
                            Authorization: `Bearer ${process.env.TODOIST_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            commands: [
                                {
                                    type: 'item_update',
                                    args: {
                                        id: taskId,
                                        deadline: deadlineDate,
                                    },
                                    uuid: uuid,
                                },
                            ],
                        }),
                    })

                    if (!response.ok) {
                        const errorText = await response.text()
                        console.error(
                            'Sync API deadline update failed:',
                            response.status,
                            errorText,
                        )
                        throw new Error(
                            `Sync API deadline update failed: ${response.status} ${errorText}`,
                        )
                    }

                    const result = await response.json()
                    console.log('✅ Sync API deadline result:', result)

                    // Check if the command was successful
                    if (result.sync_status && result.sync_status[uuid] === 'ok') {
                        console.log('✅ Deadline update confirmed successful')
                    } else {
                        console.error('❌ Deadline update failed:', result.sync_status)
                        throw new Error(
                            `Deadline update failed: ${JSON.stringify(result.sync_status)}`,
                        )
                    }
                } catch (deadlineError) {
                    console.error('❌ Deadline update error:', deadlineError)
                    throw new Error(`Failed to update deadline: ${deadlineError}`)
                }
            }

            // Build updates object for other fields (excluding projectId and deadline)
            const syncArgs: any = { id: taskId }
            let hasUpdates = false

            if (updates.content !== undefined) {
                syncArgs.content = updates.content
                hasUpdates = true
            }
            if (updates.description !== undefined) {
                syncArgs.description = updates.description
                hasUpdates = true
            }
            if (updates.priority !== undefined) {
                // Both use same format: 1=p4 (normal), 2=p3, 3=p2, 4=p1 (urgent)
                syncArgs.priority = updates.priority
                hasUpdates = true
            }
            if (updates.labels !== undefined) {
                syncArgs.labels = updates.labels
                hasUpdates = true
            }
            if (updates.assigneeId !== undefined) {
                console.log('Setting responsible_uid to:', updates.assigneeId || null)
                syncArgs.responsible_uid = updates.assigneeId || null
                hasUpdates = true
            }
            if (updates.dueString !== undefined) {
                // Parse do date string
                if (updates.dueString) {
                    try {
                        // First try to parse natural language using Todoist's do date parser
                        const parseResponse = await api.addTask({
                            content: 'temp',
                            dueString: updates.dueString,
                        })
                        if (parseResponse.due) {
                            syncArgs.due = {
                                date: parseResponse.due.date,
                                string: updates.dueString,
                                datetime: parseResponse.due.datetime,
                            }
                        }
                        // Delete the temporary task
                        await api.deleteTask(parseResponse.id)
                        hasUpdates = true
                    } catch (parseError) {
                        console.error('Failed to parse do date:', parseError)
                        throw new Error('Invalid do date format')
                    }
                } else {
                    // Remove do date
                    syncArgs.due = null
                    hasUpdates = true
                }
            }

            // Only update other fields if there are any
            if (hasUpdates) {
                console.log('📝 Updating task fields via Sync API:', syncArgs)
                
                // Generate a unique UUID for the command
                const uuid = crypto.randomUUID()

                const response = await fetch('https://api.todoist.com/sync/v9/sync', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${process.env.TODOIST_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        commands: [
                            {
                                type: 'item_update',
                                args: syncArgs,
                                uuid: uuid,
                            },
                        ],
                    }),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('Sync API update failed:', response.status, errorText)
                    throw new Error(`Sync API update failed: ${response.status} ${errorText}`)
                }

                const result = await response.json()
                console.log('✅ Sync API update result:', result)

                // Check if the command was successful
                if (result.sync_status && result.sync_status[uuid] === 'ok') {
                    console.log('✅ Task update confirmed successful')
                } else {
                    console.error('❌ Task update failed:', result.sync_status)
                    throw new Error(`Task update failed: ${JSON.stringify(result.sync_status)}`)
                }
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

    // Close (complete) a task using Sync API
    static async closeTask(taskId: string): Promise<boolean> {
        try {
            const apiKey = process.env.TODOIST_API_KEY
            if (!apiKey) {
                throw new Error('TODOIST_API_KEY is not configured')
            }

            // Generate a unique UUID for the command
            const uuid = crypto.randomUUID()

            const response = await fetch('https://api.todoist.com/sync/v9/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    commands: [
                        {
                            type: 'item_close',
                            args: {
                                id: taskId,
                            },
                            uuid: uuid,
                        },
                    ],
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Sync API error:', errorText)
                throw new Error(`Sync API request failed: ${response.status}`)
            }

            const result = await response.json()
            console.log('Close task response:', result)

            // Check if the command was successful
            if (result.sync_status && result.sync_status[uuid] === 'ok') {
                return true
            } else {
                console.error('Close task command failed:', result.sync_status)
                throw new Error('Failed to close task')
            }
        } catch (error: any) {
            console.error('Error closing task:', error)
            throw new Error(`Failed to close task: ${error.message || 'Unknown error'}`)
        }
    }

    // Create a new task using Sync API
    static async createTask(
        content: string,
        options?: {
            description?: string
            projectId?: string
            priority?: 1 | 2 | 3 | 4
            labels?: string[]
            dueString?: string
        },
    ): Promise<TodoistTaskApi> {
        try {
            const apiKey = process.env.TODOIST_API_KEY
            if (!apiKey) {
                throw new Error('TODOIST_API_KEY is not configured')
            }

            // Generate a unique UUID for the command
            const uuid = crypto.randomUUID()
            const tempId = crypto.randomUUID()

            // Build the item_add args
            const args: any = {
                id: tempId,
                content,
            }

            if (options?.description) {
                args.description = options.description
            }
            if (options?.projectId) {
                args.project_id = options.projectId
            }
            if (options?.priority) {
                // Convert priority: REST API uses 1-4 (1=natural, 4=urgent)
                // Sync API uses 1-4 (1=natural/p4, 4=urgent/p1)
                args.priority = 5 - options.priority
            }
            if (options?.labels) {
                args.labels = options.labels
            }
            if (options?.dueString) {
                // Parse do date - for now, use a simple date format
                // In production, you'd want more sophisticated parsing
                args.due = { string: options.dueString }
            }

            const response = await fetch('https://api.todoist.com/sync/v9/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    commands: [
                        {
                            type: 'item_add',
                            temp_id: tempId,
                            args: args,
                            uuid: uuid,
                        },
                    ],
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Sync API error:', errorText)
                throw new Error(`Sync API request failed: ${response.status}`)
            }

            const result = await response.json()
            console.log('Create task response:', result)

            // Check if the command was successful
            if (result.sync_status && result.sync_status[uuid] === 'ok') {
                // Get the created item from temp_id_mapping
                const createdId = result.temp_id_mapping[tempId]
                
                // Find the created item in the response
                const createdItem = result.items?.find((item: any) => item.id === createdId)
                
                if (!createdItem) {
                    throw new Error('Created task not found in response')
                }

                return {
                    id: createdItem.id,
                    content: createdItem.content,
                    description: createdItem.description || '',
                    projectId: String(createdItem.project_id),
                    priority: createdItem.priority as 1 | 2 | 3 | 4,
                    labels: createdItem.labels || [],
                    due: createdItem.due
                        ? {
                              date: createdItem.due.date,
                              string: createdItem.due.string,
                              datetime: createdItem.due.datetime || undefined,
                          }
                        : undefined,
                    deadline: createdItem.deadline
                        ? {
                              date: createdItem.deadline.date,
                              string: createdItem.deadline.string,
                          }
                        : undefined,
                    createdAt: new Date().toISOString(),
                    isCompleted: false,
                }
            } else {
                console.error('Create task command failed:', result.sync_status)
                throw new Error('Failed to create task')
            }
        } catch (error) {
            console.error('Error creating task:', error)
            throw new Error('Failed to create task')
        }
    }

    // Project metadata helpers
    static async getProjectMetadata(projectId: string): Promise<{
        description: string
        category: 'area' | 'project' | null
        priority: 1 | 2 | 3 | 4 | null
        due?: { date: string; string: string }
        deadline?: { date: string; string: string }
    } | null> {
        try {
            // Get all tasks using Sync API to avoid project ID mismatch issues
            const allTasks = await TodoistApiClient.getAllTasksSync()
            
            // Filter tasks for this project
            const projectTasks = allTasks.filter(task => task.projectId === String(projectId))
            
            const metadataTask = projectTasks.find((task) => task.labels.includes('project-metadata'))

            if (metadataTask) {
                // Extract category from labels
                let category: 'area' | 'project' | null = null
                if (metadataTask.labels.includes('area-of-responsibility')) {
                    category = 'area'
                } else if (metadataTask.labels.includes('project-type')) {
                    category = 'project'
                }

                return {
                    description: metadataTask.description || '',
                    category,
                    priority: metadataTask.priority,
                    due: metadataTask.due,
                    deadline: metadataTask.deadline,
                }
            }

            return {
                description: '',
                category: null,
                priority: null,
            }
        } catch (error) {
            console.error('Error fetching project metadata:', error)
            return null
        }
    }

    // Legacy method for backward compatibility
    static async getProjectDescription(projectId: string): Promise<string | null> {
        const metadata = await TodoistApiClient.getProjectMetadata(projectId)
        return metadata?.description || null
    }

    static async setProjectMetadata(
        projectId: string,
        metadata: {
            description?: string
            category?: 'area' | 'project' | null
            priority?: 1 | 2 | 3 | 4 | null
            dueString?: string
            deadline?: string
        },
    ): Promise<boolean> {
        try {
            const [tasks, projects] = await Promise.all([
                TodoistApiClient.getProjectTasks(projectId),
                TodoistApiClient.getProjects(),
            ])

            const project = projects.find((p) => p.id === projectId)
            if (!project) {
                throw new Error(`Project with ID ${projectId} not found`)
            }

            const existingMetadataTask = tasks.find((task) =>
                task.labels.includes('project-metadata'),
            )

            if (existingMetadataTask) {
                // Update existing metadata task - preserve existing values for fields not being updated

                // Build labels array - preserve existing category if not being updated
                const preservedLabels = ['project-metadata']
                if (metadata.category !== undefined) {
                    // Category is being explicitly set
                    if (metadata.category === 'area') {
                        preservedLabels.push('area-of-responsibility')
                    } else if (metadata.category === 'project') {
                        preservedLabels.push('project-type')
                    }
                } else {
                    // Preserve existing category labels
                    if (existingMetadataTask.labels.includes('area-of-responsibility')) {
                        preservedLabels.push('area-of-responsibility')
                    } else if (existingMetadataTask.labels.includes('project-type')) {
                        preservedLabels.push('project-type')
                    }
                }

                // Build update object - only include fields that are being updated
                const updateData: any = { labels: preservedLabels }

                // Only update description if provided
                if (metadata.description !== undefined) {
                    updateData.description = metadata.description
                }

                // Only update priority if provided
                if (metadata.priority !== undefined) {
                    updateData.priority = metadata.priority
                }

                // Only update do date if provided
                if (metadata.dueString !== undefined) {
                    updateData.dueString = metadata.dueString
                }

                // Only update deadline if provided
                if (metadata.deadline !== undefined) {
                    updateData.deadline = metadata.deadline
                }

                // Don't update content - preserve existing content (including * prefix)
                await TodoistApiClient.updateTask(existingMetadataTask.id, updateData)
            } else {
                // Create new metadata task with * prefix
                const newTaskContent = `* ${project.name}`
                const newTaskLabels = ['project-metadata']
                if (metadata.category === 'area') {
                    newTaskLabels.push('area-of-responsibility')
                } else if (metadata.category === 'project') {
                    newTaskLabels.push('project-type')
                }

                await TodoistApiClient.createTask(newTaskContent, {
                    projectId,
                    description: metadata.description || '',
                    labels: newTaskLabels,
                    ...(metadata.priority && { priority: metadata.priority }),
                    ...(metadata.dueString && { dueString: metadata.dueString }),
                    ...(metadata.deadline && { deadline: metadata.deadline }),
                })
            }

            return true
        } catch (error) {
            console.error('Error setting project metadata:', error)
            throw new Error('Failed to set project metadata')
        }
    }

    // Legacy method for backward compatibility
    static async setProjectDescription(projectId: string, description: string): Promise<boolean> {
        return TodoistApiClient.setProjectMetadata(projectId, { description })
    }

    // Project hierarchy with metadata
    static async fetchProjectHierarchyWithMetadata(): Promise<{
        flat: (TodoistProjectApi & {
            description: string
            category: 'area' | 'project' | null
            priority: 1 | 2 | 3 | 4 | null
            due?: { date: string; string: string }
            deadline?: { date: string; string: string }
        })[]
        hierarchical: (TodoistProjectApi & {
            description: string
            category: 'area' | 'project' | null
            priority: 1 | 2 | 3 | 4 | null
            due?: { date: string; string: string }
            deadline?: { date: string; string: string }
            children: (TodoistProjectApi & {
                description: string
                category: 'area' | 'project' | null
                priority: 1 | 2 | 3 | 4 | null
                due?: { date: string; string: string }
                deadline?: { date: string; string: string }
            })[]
        })[]
    }> {
        try {
            // 1. Get all projects using Sync API for consistent IDs
            const projects = await TodoistApiClient.getProjectsSync()

            // 2. Get all tasks once to avoid multiple API calls
            const allTasks = await TodoistApiClient.getAllTasksSync()
            
            // 3. Build metadata for each project from the tasks
            const projectsWithMetadata = projects.map((project) => {
                // Find metadata task for this project
                const projectTasks = allTasks.filter(task => task.projectId === String(project.id))
                const metadataTask = projectTasks.find((task) => task.labels.includes('project-metadata'))
                
                let category: 'area' | 'project' | null = null
                let description = ''
                let priority = null
                let due = undefined
                let deadline = undefined
                
                if (metadataTask) {
                    // Extract category from labels
                    if (metadataTask.labels.includes('area-of-responsibility')) {
                        category = 'area'
                    } else if (metadataTask.labels.includes('project-type')) {
                        category = 'project'
                    }
                    
                    description = metadataTask.description || ''
                    priority = metadataTask.priority
                    due = metadataTask.due
                    deadline = metadataTask.deadline
                }
                
                return {
                    ...project,
                    description,
                    category,
                    priority,
                    due,
                    deadline,
                }
            })

            // 4. Build hierarchy map
            const rootProjects = projectsWithMetadata.filter((p) => !p.parentId)
            const childProjects = projectsWithMetadata.filter((p) => p.parentId)

            const hierarchy = rootProjects.map((parent) => ({
                ...parent,
                children: childProjects.filter((child) => child.parentId === parent.id),
            }))

            return {
                flat: projectsWithMetadata,
                hierarchical: hierarchy,
            }
        } catch (error) {
            console.error('Error fetching project hierarchy:', error)
            throw new Error('Failed to fetch project hierarchy with metadata')
        }
    }

    // Legacy method for backward compatibility
    static async fetchProjectHierarchyWithDescriptions(): Promise<{
        flat: (TodoistProjectApi & { description: string })[]
        hierarchical: (TodoistProjectApi & {
            description: string
            children: (TodoistProjectApi & { description: string })[]
        })[]
    }> {
        try {
            // 1. Get all projects using Sync API for consistent IDs
            const projects = await TodoistApiClient.getProjectsSync()

            // 2. Get metadata for all projects in parallel
            const projectsWithDescription = await Promise.all(
                projects.map(async (project) => {
                    const metadata = await TodoistApiClient.getProjectMetadata(project.id)
                    return {
                        ...project,
                        description: metadata?.description || '',
                    }
                }),
            )

            // 3. Build hierarchy map
            const rootProjects = projectsWithDescription.filter((p) => !p.parentId)
            const childProjects = projectsWithDescription.filter((p) => p.parentId)

            const hierarchy = rootProjects.map((parent) => ({
                ...parent,
                children: childProjects.filter((child) => child.parentId === parent.id),
            }))

            return {
                flat: projectsWithDescription,
                hierarchical: hierarchy,
            }
        } catch (error) {
            console.error('Error fetching project hierarchy:', error)
            throw new Error('Failed to fetch project hierarchy with descriptions')
        }
    }

    // Generate context for LLM requests
    static async generateTodoistContext(): Promise<{
        projects: (TodoistProjectApi & {
            description: string
            category: 'area' | 'project' | null
            priority: 1 | 2 | 3 | 4 | null
        })[]
        hierarchy: (TodoistProjectApi & {
            description: string
            category: 'area' | 'project' | null
            priority: 1 | 2 | 3 | 4 | null
            children: (TodoistProjectApi & {
                description: string
                category: 'area' | 'project' | null
                priority: 1 | 2 | 3 | 4 | null
            })[]
        })[]
        summary: {
            totalProjects: number
            projectsWithDescriptions: number
            rootProjects: number
            areas: number
            projects: number
        }
    }> {
        try {
            const { flat, hierarchical } =
                await TodoistApiClient.fetchProjectHierarchyWithMetadata()

            return {
                projects: flat,
                hierarchy: hierarchical,
                summary: {
                    totalProjects: flat.length,
                    projectsWithDescriptions: flat.filter((p) => p.description.trim()).length,
                    rootProjects: hierarchical.length,
                    areas: flat.filter((p) => p.category === 'area').length,
                    projects: flat.filter((p) => p.category === 'project').length,
                },
            }
        } catch (error) {
            console.error('Error generating Todoist context:', error)
            throw new Error('Failed to generate Todoist context')
        }
    }
}
