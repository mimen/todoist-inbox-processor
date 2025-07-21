import { NextResponse } from 'next/server';
import { TodoistApiClient } from '@/lib/todoist-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');
  
  if (!filter) {
    return NextResponse.json({ error: 'Filter parameter is required' }, { status: 400 });
  }

  try {
    // Use the Todoist API to get tasks matching the filter
    const tasks = await TodoistApiClient.getTasks({ filter });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching filtered tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered tasks' },
      { status: 500 }
    );
  }
}