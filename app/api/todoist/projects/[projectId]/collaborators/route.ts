import { NextRequest, NextResponse } from 'next/server'
import { TodoistApi } from '@doist/todoist-api-typescript'

const api = new TodoistApi(process.env.TODOIST_API_KEY!)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params
        
        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            )
        }

        // Try to get current user from sync API first
        const syncResponse = await fetch('https://api.todoist.com/sync/v9/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.TODOIST_API_KEY}`,
            },
            body: JSON.stringify({
                sync_token: '*',
                resource_types: ['user'],
            }),
        })
        
        let currentUser = {
            id: '13801296',
            name: 'You',
            email: '',
            avatarBig: undefined,
            avatarMedium: undefined,
            avatarSmall: undefined,
        }
        
        if (syncResponse.ok) {
            const syncData = await syncResponse.json()
            if (syncData.user) {
                currentUser = {
                    id: String(syncData.user.id),
                    name: syncData.user.full_name || syncData.user.email || 'You',
                    email: syncData.user.email || '',
                    avatarBig: syncData.user.avatar_big,
                    avatarMedium: syncData.user.avatar_medium,
                    avatarSmall: syncData.user.avatar_s640 || syncData.user.avatar_medium,
                }
            }
        }
        console.log('Using current user:', currentUser)

        // Fetch collaborators for the project
        let users = []
        let isPersonalProject = true
        
        try {
            console.log('Fetching collaborators for project:', projectId)
            
            // Skip trying to fetch project details with REST API since we're using Sync API IDs
            // The getProjectCollaborators call will tell us if it's a personal project (400 error)
            
            const response = await api.getProjectCollaborators(projectId)
            console.log('Raw collaborators API response:', response)
            console.log('Response type:', typeof response)
            console.log('Response keys:', Object.keys(response || {}))
            
            // Handle different response formats
            let collaborators = []
            if (Array.isArray(response)) {
                collaborators = response
            } else if (response && typeof response === 'object') {
                // Try different field names the API might use
                collaborators = response.results || response.data || response.collaborators || response.users || []
            }
            
            console.log('Extracted collaborators count:', collaborators.length)
            console.log('First collaborator (if any):', collaborators[0])
            
            // Sometimes the API returns users who are no longer active collaborators
            // but still have tasks assigned. We need to handle pagination.
            if (response.nextCursor) {
                console.log('There are more collaborators, fetching next page...')
                // You could implement pagination here if needed
            }
            
            // Transform collaborator data to a simpler format
            users = collaborators.map(collab => {
                // Process collaborator data
                
                // Extract user ID - could be in different fields depending on API version
                const userId = collab.userId || collab.user_id || collab.id
                
                // Handle different name formats
                const name = collab.fullName || collab.full_name || collab.name || collab.email || 'Unknown User'
                
                // Handle different avatar URL formats
                const imageId = collab.imageId || collab.image_id
                let avatarSmall, avatarMedium, avatarBig
                
                if (imageId) {
                    avatarSmall = `https://dcff1xvirvpfp.cloudfront.net/${imageId}_s640.jpg`
                    avatarMedium = `https://dcff1xvirvpfp.cloudfront.net/${imageId}_medium.jpg`
                    avatarBig = `https://dcff1xvirvpfp.cloudfront.net/${imageId}_big.jpg`
                } else if (collab.avatarS640 || collab.avatar_s640) {
                    // Direct avatar URLs from API
                    avatarSmall = collab.avatarS640 || collab.avatar_s640
                    avatarMedium = collab.avatarMedium || collab.avatar_medium
                    avatarBig = collab.avatarBig || collab.avatar_big
                } else if (collab.avatar_small || collab.avatarSmall) {
                    avatarSmall = collab.avatar_small || collab.avatarSmall
                    avatarMedium = collab.avatar_medium || collab.avatarMedium
                    avatarBig = collab.avatar_big || collab.avatarBig
                }
                
                return {
                    id: String(userId), // Always return as string
                    name: name,
                    email: collab.email || '',
                    avatarBig,
                    avatarMedium,
                    avatarSmall,
                }
            })
            
            // If we got collaborators, it's definitely not a personal project
            if (users.length > 0) {
                isPersonalProject = false
            }
        } catch (error: any) {
            console.warn('Error fetching collaborators:', error.message || error)
            
            // Check if it's a known error
            if (error.httpStatusCode === 400 || error.response?.status === 400) {
                console.log('This appears to be a personal project (400 error) - collaborators not available')
                isPersonalProject = true
            } else if (error.httpStatusCode === 403 || error.response?.status === 403) {
                console.log('Access denied to collaborators - might need Business/Pro account')
                // Don't assume it's personal, just that we can't access collaborators
                isPersonalProject = false
            } else {
                console.warn('Error details:', {
                    httpStatusCode: error.httpStatusCode,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    error: error.error
                })
            }
        }
        
        // For personal projects, include the current user
        // For shared projects where we can't get collaborators, return empty array
        if (isPersonalProject && currentUser && !users.find(u => u.id === currentUser.id)) {
            users.unshift(currentUser)
        }
        
        // Add any unknown assignees from the request
        const unknownAssigneeId = request.nextUrl.searchParams.get('includeAssignee')
        if (unknownAssigneeId && !users.find(u => u.id === unknownAssigneeId)) {
            console.log('Adding unknown assignee to list:', unknownAssigneeId)
            users.push({
                id: unknownAssigneeId,
                name: `User ${unknownAssigneeId}`,
                email: '',
                avatarBig: undefined,
                avatarMedium: undefined,
                avatarSmall: undefined,
            })
        }
        
        console.log('Final users list:', users)
        console.log('Is personal project:', isPersonalProject)

        return NextResponse.json({
            users,
            isPersonalProject,
            hasCollaborators: users.length > 1 || (!isPersonalProject && users.length > 0)
        })
    } catch (error) {
        console.error('Error fetching project collaborators:', error)
        return NextResponse.json(
            { error: 'Failed to fetch project collaborators' },
            { status: 500 }
        )
    }
}