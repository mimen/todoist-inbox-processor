export interface ProjectSuggestion {
  projectId: string
  projectName: string
  confidence: number
  reasoning: string
}

interface CachedSuggestions {
  taskId: string
  taskContent: string
  taskDescription: string
  suggestions: ProjectSuggestion[]
  timestamp: number
}

class SuggestionsCache {
  private cache = new Map<string, CachedSuggestions>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 50 // Keep cache reasonable size

  private generateCacheKey(taskId: string, content: string, description: string): string {
    // Create a hash-like key based on task content for change detection
    const contentHash = btoa(content + (description || '')).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
    return `${taskId}_${contentHash}`
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION
  }

  private cleanExpired(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (this.isExpired(cached.timestamp)) {
        this.cache.delete(key)
      }
    }
  }

  private ensureCacheSize(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE + 10)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  getSuggestions(taskId: string, content: string, description: string = ''): ProjectSuggestion[] | null {
    this.cleanExpired()
    
    const key = this.generateCacheKey(taskId, content, description)
    const cached = this.cache.get(key)
    
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.suggestions
    }
    
    return null
  }

  setSuggestions(
    taskId: string, 
    content: string, 
    description: string = '', 
    suggestions: ProjectSuggestion[]
  ): void {
    this.cleanExpired()
    this.ensureCacheSize()
    
    const key = this.generateCacheKey(taskId, content, description)
    this.cache.set(key, {
      taskId,
      taskContent: content,
      taskDescription: description,
      suggestions,
      timestamp: Date.now()
    })
  }

  async generateSuggestions(
    taskId: string,
    content: string,
    description: string = '',
    projectHierarchy: any,
    currentProjectId?: string
  ): Promise<ProjectSuggestion[]> {
    // Check cache first
    const cached = this.getSuggestions(taskId, content, description)
    if (cached) {
      return cached
    }

    try {
      // Debug: Log what we're sending to the API
      console.log('Generating suggestions with hierarchy:', {
        projectCount: projectHierarchy?.projects?.length || 0,
        firstProject: projectHierarchy?.projects?.[0],
        currentProjectId
      })

      const response = await fetch('/api/llm/generate-project-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskContent: content,
          taskDescription: description,
          projectHierarchy,
          currentProjectId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const suggestions = data.suggestions || []
        
        console.log('API returned suggestions:', suggestions)
        
        // Cache the result
        this.setSuggestions(taskId, content, description, suggestions)
        
        return suggestions
      } else {
        console.error('Failed to generate suggestions:', response.statusText)
        return []
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  async prefetchSuggestions(
    tasks: Array<{ id: string; content: string; description?: string; projectId: string }>,
    projectHierarchy: any
  ): Promise<void> {
    const prefetchPromises = tasks.map(task => 
      this.generateSuggestions(
        task.id,
        task.content,
        task.description || '',
        projectHierarchy,
        task.projectId
      )
    )

    try {
      await Promise.all(prefetchPromises)
    } catch (error) {
      console.error('Error prefetching suggestions:', error)
    }
  }

  invalidateTask(taskId: string): void {
    // Remove all cache entries for this task ID
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      this.cache.get(key)?.taskId === taskId
    )
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  clear(): void {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).map(v => ({
        taskId: v.taskId,
        content: v.taskContent.slice(0, 30) + '...',
        suggestionsCount: v.suggestions.length,
        age: Math.round((Date.now() - v.timestamp) / 1000)
      }))
    }
  }
}

// Export singleton instance
export const suggestionsCache = new SuggestionsCache()
export type { ProjectSuggestion }