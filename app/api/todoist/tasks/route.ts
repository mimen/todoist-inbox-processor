import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  try {
    console.log('API: Fetching tasks for projectId:', projectId)
    
    let tasks
    if (projectId) {
      tasks = await TodoistApiClient.getProjectTasks(projectId)
    } else {
      tasks = await TodoistApiClient.getInboxTasks()
    }
    
    console.log('API: Returning tasks:', tasks.length)
    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error('API Error Details:', {
      message: error.message,
      stack: error.stack,
      response: error.response,
      data: error.data,
      fullError: error
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks',
        details: error.message || 'Unknown error',
        projectId: projectId
      },
      { status: 500 }
    )
  }
}