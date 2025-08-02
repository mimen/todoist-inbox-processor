import { NextResponse } from 'next/server';
import { TodoistApiClient, transformApiTaskToAppTask } from '@/lib/todoist-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');
  
  if (!filter) {
    return NextResponse.json({ error: 'Filter parameter is required' }, { status: 400 });
  }

  try {
    // Use the Todoist API to get tasks matching the filter
    const tasks = await TodoistApiClient.getTasks(filter);
    
    // Transform tasks to app format
    const transformedTasks = tasks.map(transformApiTaskToAppTask);
    
    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('Error fetching filtered tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered tasks' },
      { status: 500 }
    );
  }
}