import { NextResponse } from 'next/server';

const TODOIST_API_KEY = process.env.TODOIST_API_KEY;
const SYNC_API_URL = 'https://api.todoist.com/sync/v9/sync';

export async function GET() {
  if (!TODOIST_API_KEY) {
    return NextResponse.json({ error: 'Todoist API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(SYNC_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TODOIST_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sync_token: '*',
        resource_types: '["filters"]'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the filters array from the sync response
    return NextResponse.json(data.filters || []);
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}