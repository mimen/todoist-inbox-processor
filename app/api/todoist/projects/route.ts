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