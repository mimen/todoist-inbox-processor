import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const description = await TodoistApiClient.getProjectDescription(params.projectId)
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
  { params }: { params: { projectId: string } }
) {
  try {
    const { description } = await request.json()
    
    if (typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    await TodoistApiClient.setProjectDescription(params.projectId, description)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating project description:', error)
    return NextResponse.json(
      { error: 'Failed to update project description' },
      { status: 500 }
    )
  }
}