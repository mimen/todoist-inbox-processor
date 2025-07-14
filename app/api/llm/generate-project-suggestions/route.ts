import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface ProjectSuggestion {
  projectId: string
  projectName: string
  confidence: number
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const { taskContent, taskDescription, projectHierarchy, currentProjectId } = await request.json()

    if (!taskContent || !projectHierarchy) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Build context from project hierarchy, excluding inbox
    const projectContext = projectHierarchy.projects
      ?.filter((project: any) => !project.isInboxProject)
      ?.map((project: any) => {
        const desc = project.description ? ` - ${project.description}` : ''
        return `• ${project.name} (ID: ${project.id})${desc}`
      })
      .join('\n') || 'No projects available'

    const prompt = `Based on the task content and available projects, suggest 2-3 most appropriate projects for this task.

Task: "${taskContent}"
${taskDescription ? `Description: "${taskDescription}"` : ''}

Available Projects:
${projectContext}

Current Project ID: ${currentProjectId}

Respond with a JSON object containing an array of suggestions. Each suggestion should have:
- projectId: the exact project ID from the list above
- projectName: the exact project name from the list above  
- confidence: a number between 0 and 1 indicating how confident you are
- reasoning: a brief explanation (max 50 words) why this project fits

Only suggest projects that exist in the list above. Never suggest the Inbox project. Focus on the 2-3 best matches. If the task is already in a good project, you can still suggest alternatives.

Format: {"suggestions": [{"projectId": "...", "projectName": "...", "confidence": 0.85, "reasoning": "..."}]}`

    let suggestions: ProjectSuggestion[] = []

    if (ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.content?.[0]?.text || ''
          
          try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              suggestions = parsed.suggestions || []
            } else {
              console.error('No JSON found in Anthropic response:', content)
            }
          } catch (parseError) {
            console.error('Failed to parse Anthropic response:', content)
          }
        }
      } catch (error) {
        console.error('Anthropic API error:', error)
      }
    }

    // Fallback to OpenAI if Anthropic failed or not available
    if (suggestions.length === 0 && OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.3
          })
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content || ''
          
          try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              suggestions = parsed.suggestions || []
            } else {
              console.error('No JSON found in OpenAI response:', content)
            }
          } catch (parseError) {
            console.error('Failed to parse OpenAI response:', content)
          }
        }
      } catch (error) {
        console.error('OpenAI API error:', error)
      }
    }

    // Validate suggestions against available projects (excluding inbox)
    const nonInboxProjects = projectHierarchy.projects?.filter((p: any) => !p.isInboxProject) || []
    const validProjects = new Set(nonInboxProjects.map((p: any) => p.id))
    const validSuggestions = suggestions.filter(s => 
      validProjects.has(s.projectId) && 
      s.projectId !== currentProjectId &&
      s.confidence >= 0.3
    )

    return NextResponse.json({ 
      suggestions: validSuggestions.slice(0, 3)
    })

  } catch (error) {
    console.error('Error generating project suggestions:', error)
    return NextResponse.json({ 
      error: 'Failed to generate suggestions',
      suggestions: []
    }, { status: 500 })
  }
}