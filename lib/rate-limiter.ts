interface RateLimitError {
  retryAfter: number
  errorCode?: number
}

export class RateLimiter {
  private static retryQueue: Map<string, Promise<any>> = new Map()
  private static lastRequestTime: Map<string, number> = new Map()
  private static minRequestInterval = 100 // Minimum 100ms between requests
  
  static async executeWithRateLimit<T>(
    key: string,
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    // Check if there's already a pending request for this key
    const pendingRequest = this.retryQueue.get(key)
    if (pendingRequest) {
      return pendingRequest
    }

    // Ensure minimum interval between requests
    const lastRequest = this.lastRequestTime.get(key) || 0
    const timeSinceLastRequest = Date.now() - lastRequest
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      )
    }

    const executeWithRetry = async (attempt: number = 0): Promise<T> => {
      try {
        this.lastRequestTime.set(key, Date.now())
        const result = await fn()
        this.retryQueue.delete(key)
        return result
      } catch (error: any) {
        // Check if it's a rate limit error
        if (error?.message?.includes('429') || error?.statusCode === 429) {
          const retryAfter = this.extractRetryAfter(error)
          
          if (attempt < maxRetries) {
            console.log(`Rate limited. Waiting ${retryAfter}ms before retry (attempt ${attempt + 1}/${maxRetries})`)
            
            // Store the retry promise to prevent duplicate requests
            const retryPromise = new Promise<T>((resolve, reject) => {
              setTimeout(async () => {
                try {
                  const result = await executeWithRetry(attempt + 1)
                  resolve(result)
                } catch (err) {
                  reject(err)
                }
              }, retryAfter)
            })
            
            this.retryQueue.set(key, retryPromise)
            return retryPromise
          }
        }
        
        this.retryQueue.delete(key)
        throw error
      }
    }

    return executeWithRetry()
  }

  private static extractRetryAfter(error: any): number {
    // Try to extract retry_after from error response
    try {
      if (error?.message) {
        const match = error.message.match(/"retry_after":(\d+)/)
        if (match) {
          // Convert seconds to milliseconds and add a small buffer
          return (parseInt(match[1]) * 1000) + 1000
        }
      }
    } catch {
      // Ignore parsing errors
    }
    
    // Default exponential backoff: 2^attempt * 1000ms base
    return Math.min(60000, Math.pow(2, 1) * 1000) // Max 60 seconds
  }

  static clearCache(key?: string) {
    if (key) {
      this.retryQueue.delete(key)
      this.lastRequestTime.delete(key)
    } else {
      this.retryQueue.clear()
      this.lastRequestTime.clear()
    }
  }
}