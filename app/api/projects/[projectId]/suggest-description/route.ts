import { NextRequest, NextResponse } from 'next/server'
import { TodoistApiClient } from '@/lib/todoist-api'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { currentDescription } = await request.json()
    
    // Get project details and tasks
    const [projects, tasks] = await Promise.all([
      TodoistApiClient.getProjects(),
      TodoistApiClient.getProjectTasks(projectId)
    ])
    
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Build context from project tasks
    const taskList = tasks
      .filter(task => !task.content.startsWith('* ')) // Exclude description tasks
      .slice(0, 10) // Limit to first 10 tasks
      .map(task => `• ${task.content}`)
      .join('\n')

    const prompt = `Generate a concise project description for the Todoist project "${project.name}".

Current Description: ${currentDescription || 'None'}

Recent Tasks in this Project:
${taskList || 'No tasks yet'}

Write a 1-2 sentence description that captures the purpose and scope of this project. Be specific and actionable. Focus on what this project is about, not what it will accomplish.

Respond with only the suggested description text, nothing else.`

    let suggestion = ''

    // Try Anthropic first
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
            max_tokens: 200,
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
          suggestion = data.content?.[0]?.text?.trim() || ''
        }
      } catch (error) {
        console.error('Anthropic API error:', error)
      }
    }

    // Fallback to OpenAI
    if (!suggestion && OPENAI_API_KEY) {
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
            max_tokens: 200,
            temperature: 0.3
          })
        })

        if (response.ok) {
          const data = await response.json()
          suggestion = data.choices?.[0]?.message?.content?.trim() || ''
        }
      } catch (error) {
        console.error('OpenAI API error:', error)
      }
    }

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Failed to generate suggestion. Please check your API keys.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ suggestion })

  } catch (error) {
    console.error('Error generating project description suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}