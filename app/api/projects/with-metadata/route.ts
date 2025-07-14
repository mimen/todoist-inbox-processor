import { NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET() {
  try {
    const { flat } = await TodoistApiClient.fetchProjectHierarchyWithMetadata()
    return NextResponse.json(flat)
  } catch (error) {
    console.error('Error fetching projects with metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects with metadata' },
      { status: 500 }
    )
  }
}