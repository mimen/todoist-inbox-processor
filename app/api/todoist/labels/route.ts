import { NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET() {
  try {
    const labels = await TodoistApiClient.getLabels()
    return NextResponse.json(labels)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    )
  }
}