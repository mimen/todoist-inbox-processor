import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient, TaskUpdateRequest } from '@/lib/todoist-api'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const updates: TaskUpdateRequest = await request.json()
    
    console.log('API Route: Updating task', taskId, 'with updates:', updates)
    
    const result = await TodoistApiClient.updateTask(taskId, updates)
    console.log('API Route: Update result:', result)
    
    // If dates were updated, return the parsed dates from the API
    if (result.dates) {
      console.log('Returning parsed dates:', result.dates)
      return NextResponse.json({ 
        success: true,
        dates: result.dates 
      })
    }
    
    // Return success with the updates that were applied
    // The client will merge these updates with the existing task
    return NextResponse.json({ 
      success: true,
      updates: updates 
    })
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    
    await TodoistApiClient.closeTask(taskId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to close task' },
      { status: 500 }
    )
  }
}