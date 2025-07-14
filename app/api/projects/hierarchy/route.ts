import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'hierarchical'

    const { flat, hierarchical } = await TodoistApiClient.fetchProjectHierarchyWithDescriptions()

    switch (format) {
      case 'flat':
        return NextResponse.json({ projects: flat })
      
      case 'context':
        return NextResponse.json({
          projects: flat,
          hierarchy: hierarchical,
          summary: {
            totalProjects: flat.length,
            projectsWithDescriptions: flat.filter(p => p.description.trim()).length,
            rootProjects: hierarchical.length
          }
        })
      
      case 'hierarchical':
      default:
        return NextResponse.json({ 
          hierarchy: hierarchical,
          flat: flat
        })
    }
  } catch (error) {
    console.error('Error fetching project hierarchy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project hierarchy' },
      { status: 500 }
    )
  }
}