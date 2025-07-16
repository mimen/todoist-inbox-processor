import { NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET() {
    try {
        console.log('API: Fetching projects using Sync API')

        // Use the Sync API to get projects with consistent IDs
        const projects = await TodoistApiClient.getProjectsSync()

        console.log('API: Total projects fetched via Sync API:', projects.length)

        return NextResponse.json({
            projects,
            total: projects.length,
            message: 'Projects fetched successfully via Sync API',
        })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
}
