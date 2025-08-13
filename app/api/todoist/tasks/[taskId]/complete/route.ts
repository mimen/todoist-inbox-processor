import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    
    console.log('API Route: Completing task', taskId)
    
    const result = await TodoistApiClient.closeTask(taskId)
    
    if (result) {
      console.log('API Route: Task completed successfully')
      return NextResponse.json({ success: true })
    } else {
      throw new Error('Failed to complete task')
    }
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}