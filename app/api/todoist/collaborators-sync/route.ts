import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TODOIST_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TODOIST_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Use sync API to get all collaborators and collaborator states
    const response = await fetch('https://api.todoist.com/sync/v9/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sync_token: '*',
        resource_types: ['collaborators', 'collaborator_states', 'user', 'live_notifications_last_read_id'],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Sync API error:', errorText)
      return NextResponse.json(
        { error: `Sync API request failed: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log(`👥 Sync API: ${result.collaborators?.length || 0} collaborators, ${result.collaborator_states?.length || 0} states`)
    
    // Build a map of all users (including current user)
    const usersMap = new Map()
    
    // Add current user
    if (result.user) {
      // Generate avatar URLs from image_id for current user
      let avatarSmall, avatarMedium, avatarBig
      if (result.user.image_id) {
        const baseUrl = `https://dcff1xvirvpfp.cloudfront.net/${result.user.image_id}`
        avatarSmall = `${baseUrl}_small.jpg`
        avatarMedium = `${baseUrl}_medium.jpg`
        avatarBig = `${baseUrl}_big.jpg`
      }
      
      usersMap.set(result.user.id, {
        id: String(result.user.id),
        name: result.user.full_name || result.user.email,
        email: result.user.email,
        avatarSmall: avatarSmall || result.user.avatar_s640,
        avatarMedium: avatarMedium || result.user.avatar_medium,
        avatarBig: avatarBig || result.user.avatar_big,
        isCurrentUser: true,
      })
    }

    // Add collaborators from all projects
    if (result.collaborators) {
      result.collaborators.forEach((collab: any) => {
        const userId = String(collab.id)
        
        // Generate avatar URLs from image_id
        let avatarSmall, avatarMedium, avatarBig
        if (collab.image_id) {
          // Todoist avatar URL pattern
          const baseUrl = `https://dcff1xvirvpfp.cloudfront.net/${collab.image_id}`
          avatarSmall = `${baseUrl}_small.jpg`
          avatarMedium = `${baseUrl}_medium.jpg`
          avatarBig = `${baseUrl}_big.jpg`
        }
        
        // Update existing user or add new one
        if (usersMap.has(userId)) {
          // Update with better data if available (e.g., if current user has image_id in collaborators)
          const existing = usersMap.get(userId)
          if (!existing.avatarSmall && avatarSmall) {
            existing.avatarSmall = avatarSmall
            existing.avatarMedium = avatarMedium
            existing.avatarBig = avatarBig
          }
        } else {
          usersMap.set(userId, {
            id: userId,
            name: collab.full_name || collab.email || `User ${userId}`,
            email: collab.email || '',
            avatarSmall,
            avatarMedium,
            avatarBig,
            isCurrentUser: userId === String(result.user?.id),
          })
        }
      })
    }

    // If we have collaborator states but no collaborators resource,
    // create minimal user objects for active collaborators
    if (result.collaborator_states && !result.collaborators) {
      const activeUserIds = new Set<string>()
      result.collaborator_states.forEach((state: any) => {
        if (state.state === 'active') {
          activeUserIds.add(String(state.user_id))
        }
      })

      activeUserIds.forEach((userId) => {
        if (!usersMap.has(userId) && userId !== String(result.user?.id)) {
          usersMap.set(userId, {
            id: userId,
            name: `User ${userId}`,
            email: '',
            avatarSmall: undefined,
            avatarMedium: undefined,
            avatarBig: undefined,
            isCurrentUser: false,
          })
        }
      })
    }

    // Build project collaborators map using Sets to avoid duplicates
    const projectCollaboratorsMap: Record<string, Set<string>> = {}
    
    if (result.collaborator_states) {
      result.collaborator_states.forEach((state: any) => {
        const projectId = String(state.project_id)
        const userId = String(state.user_id)
        
        if (!projectCollaboratorsMap[projectId]) {
          projectCollaboratorsMap[projectId] = new Set()
        }
        
        // Only include active collaborators
        if (state.state === 'active') {
          projectCollaboratorsMap[projectId].add(userId)
        }
      })
    }
    
    // Convert Sets to arrays
    const projectCollaborators: Record<string, string[]> = {}
    Object.entries(projectCollaboratorsMap).forEach(([projectId, userSet]) => {
      projectCollaborators[projectId] = Array.from(userSet)
    })

    // Convert users map to array
    const allUsers = Array.from(usersMap.values())

    // Log summary
    console.log(`✅ Loaded ${allUsers.length} users across ${Object.keys(projectCollaborators).length} projects`)

    return NextResponse.json({
      currentUser: result.user ? {
        id: String(result.user.id),
        name: result.user.full_name || result.user.email,
        email: result.user.email,
      } : null,
      allUsers,
      projectCollaborators,
      // Also return raw data for debugging
      debug: {
        totalUsers: allUsers.length,
        totalProjects: Object.keys(projectCollaborators).length,
        rawCollaborators: result.collaborators?.length || 0,
        rawStates: result.collaborator_states?.length || 0,
        usersWithProperNames: allUsers.filter(u => u.name && !u.name.startsWith('User ')).length,
        hasCollaboratorResource: !!result.collaborators,
        hasCollaboratorStates: !!result.collaborator_states,
      }
    })
  } catch (error) {
    console.error('Error fetching collaborators via Sync API:', error)
    
    // Return minimal data structure even if API fails
    return NextResponse.json({
      currentUser: {
        id: '13801296', // Fallback ID - should be dynamic in production
        name: 'Current User',
        email: '',
      },
      allUsers: [{
        id: '13801296',
        name: 'Current User',
        email: '',
        avatarSmall: undefined,
        avatarMedium: undefined,
        avatarBig: undefined,
        isCurrentUser: true,
      }],
      projectCollaborators: {},
      debug: {
        totalUsers: 1,
        totalProjects: 0,
        rawCollaborators: 0,
        rawStates: 0,
        usersWithProperNames: 1,
        hasCollaboratorResource: false,
        hasCollaboratorStates: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    })
  }
}