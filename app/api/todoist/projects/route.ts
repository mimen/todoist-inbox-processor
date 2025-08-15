import { NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET() {
  try {
    const projects = await TodoistApiClient.getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, parentId, color } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const project = await TodoistApiClient.createProject({
      name,
      parentId,
      color
    })
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}