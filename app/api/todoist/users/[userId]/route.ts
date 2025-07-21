import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const apiKey = process.env.TODOIST_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TODOIST_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Unfortunately, Todoist doesn't provide a public API to fetch user details by ID
    // We'll have to work with what we get from the sync API
    // This endpoint is here as a placeholder for potential future use
    
    return NextResponse.json({
      id: userId,
      name: `User ${userId}`,
      email: '',
      avatarSmall: undefined,
      avatarMedium: undefined,
      avatarBig: undefined,
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}