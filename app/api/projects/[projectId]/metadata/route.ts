import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const metadata = await TodoistApiClient.getProjectMetadata(projectId)
    return NextResponse.json(metadata || {
      description: '',
      category: null,
      priority: null
    })
  } catch (error) {
    console.error('Error fetching project metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project metadata' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const body = await request.json()
    const { description, category, priority, dueString, deadline } = body
    
    // Validate input first before making API calls
    
    // Validate category if provided
    if (category !== undefined && category !== null && !['area', 'project'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be "area", "project", or null' },
        { status: 400 }
      )
    }
    
    // Validate priority if provided
    if (priority !== undefined && priority !== null && ![1, 2, 3, 4].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be 1, 2, 3, 4, or null' },
        { status: 400 }
      )
    }

    await TodoistApiClient.setProjectMetadata(projectId, {
      description,
      category,
      priority,
      dueString,
      deadline
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating project metadata:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Return more specific status codes based on error
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: `Failed to update project metadata: ${errorMessage}` },
      { status: 500 }
    )
  }
}