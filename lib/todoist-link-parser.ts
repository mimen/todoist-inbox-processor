/**
 * Parse Todoist link syntax in task content
 * Format: [link text](url)
 */

export interface ParsedSegment {
  type: 'text' | 'link'
  content: string
  url?: string
}

export function parseTodoistLinks(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }

    // Add the link
    segments.push({
      type: 'link',
      content: match[1],
      url: match[2]
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last link
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  // If no segments were created (no links found), return the entire content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content
    })
  }

  return segments
}