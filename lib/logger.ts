/**
 * Simple logger for the application
 */

export const logger = {
  startup: (message: string) => {
    console.log(`🚀 ${message}`)
  },
  
  request: (method: string, path: string, status?: number) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8)
    if (status) {
      console.log(`[${timestamp}] ${method} ${path} → ${status}`)
    } else {
      console.log(`[${timestamp}] ${method} ${path}`)
    }
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8)
    console.error(`[${timestamp}] ❌ ${message}`, error?.message || error)
  },
  
  info: (message: string) => {
    console.log(`ℹ️  ${message}`)
  },
  
  success: (message: string) => {
    console.log(`✅ ${message}`)
  }
}