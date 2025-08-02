import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const description = await TodoistApiClient.getProjectDescription(projectId)
    return NextResponse.json({ description: description || '' })
  } catch (error) {
    console.error('Error fetching project description:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project description' },
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
    const { description } = await request.json()
    
    if (typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    await TodoistApiClient.setProjectDescription(projectId, description)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating project description:', error)
    return NextResponse.json(
      { error: 'Failed to update project description' },
      { status: 500 }
    )
  }
}