import { NextResponse } from 'next/server'
import { TodoistApiClient, transformApiTaskToAppTask } from '@/lib/todoist-api'

export async function GET() {
    try {
        console.log('API: Fetching all tasks using Sync API')

        // Use the Sync API to get ALL tasks in one efficient request
        const allTasks = await TodoistApiClient.getAllTasksSync()

        console.log('API: Total tasks fetched via Sync API:', allTasks.length)

        // Transform all tasks to app format
        const transformedTasks = allTasks.map(transformApiTaskToAppTask)

        return NextResponse.json({
            tasks: transformedTasks,
            total: transformedTasks.length,
            message: 'All tasks fetched successfully via Sync API',
        })
    } catch (error) {
        console.error('API Error:', error)

        // Fallback to regular API if sync fails
        try {
            console.log('API: Falling back to regular getTasks API')
            const allTasks = await TodoistApiClient.getTasks()

            // Transform all tasks to app format
            const transformedTasks = allTasks.map(transformApiTaskToAppTask)

            return NextResponse.json({
                tasks: transformedTasks,
                total: transformedTasks.length,
                message: 'Tasks fetched via regular API (fallback)',
            })
        } catch (fallbackError) {
            console.error('Fallback API Error:', fallbackError)
            return NextResponse.json({ error: 'Failed to fetch all tasks' }, { status: 500 })
        }
    }
}
