import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    console.log('API: Fetching tasks for projectId:', projectId)
    
    let tasks
    if (projectId) {
      tasks = await TodoistApiClient.getProjectTasks(projectId)
    } else {
      tasks = await TodoistApiClient.getInboxTasks()
    }
    
    console.log('API: Returning tasks:', tasks.length)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}