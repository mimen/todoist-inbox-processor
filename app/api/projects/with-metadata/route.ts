import { NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'
import { ApiCache } from '@/lib/api-cache'

const CACHE_KEY = 'projects-with-metadata'
const CACHE_TTL = 30000 // 30 seconds cache

export async function GET() {
  try {
    // Check cache first
    const cached = ApiCache.get(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // If not cached, fetch from API
    const { flat } = await TodoistApiClient.fetchProjectHierarchyWithMetadata()
    
    // Cache the result
    ApiCache.set(CACHE_KEY, flat, CACHE_TTL)
    
    return NextResponse.json(flat)
  } catch (error) {
    console.error('Error fetching projects with metadata:', error)
    
    // If we get a rate limit error, return a more specific error
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch projects with metadata' },
      { status: 500 }
    )
  }
}