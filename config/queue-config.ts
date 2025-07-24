import { z } from 'zod'
import { ProcessingModeType } from '@/types/processing-mode'

// Schema for validating queue configuration
const QueueItemSchema = z.object({
  type: z.enum(['project', 'priority', 'label', 'date', 'deadline', 'preset', 'all'] as const),
  value: z.union([
    z.string(),
    z.array(z.string()),
    z.null()
  ]).optional(),
  label: z.string().optional(),
  config: z.object({
    sortBy: z.enum(['default', 'name', 'priority', 'count']).optional(),
    reverseOrder: z.boolean().optional(),
    enableSearch: z.boolean().optional(),
    multiSelect: z.boolean().optional(),
    excludeLabels: z.array(z.string()).optional(),
    includeCompleted: z.boolean().optional(),
    customFilter: z.string().optional() // For future: custom filter function name
  }).optional()
})

const QueueConfigSchema = z.object({
  version: z.string(),
  queues: z.array(QueueItemSchema),
  globalSettings: z.object({
    autoProgress: z.boolean().optional(),
    skipEmptyQueues: z.boolean().optional(),
    persistState: z.boolean().optional(),
    showCompletionStats: z.boolean().optional()
  }).optional()
})

export type QueueItem = z.infer<typeof QueueItemSchema>
export type QueueConfig = z.infer<typeof QueueConfigSchema>

// Default hardcoded configuration (current implementation)
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  version: '1.0.0',
  queues: [
    { type: 'project', config: { sortBy: 'default', enableSearch: true } },
    { type: 'priority', config: { sortBy: 'default' } },
    { type: 'label', config: { sortBy: 'count', enableSearch: true, multiSelect: true } },
    { type: 'date', config: { sortBy: 'default' } },
    { type: 'deadline', config: { sortBy: 'default' } },
    { type: 'preset', config: { sortBy: 'default' } },
    { type: 'all', config: { sortBy: 'count' } }
  ],
  globalSettings: {
    autoProgress: false,
    skipEmptyQueues: false,
    persistState: false,
    showCompletionStats: true
  }
}

// Configuration loader utilities
export class QueueConfigLoader {
  private static config: QueueConfig = DEFAULT_QUEUE_CONFIG

  /**
   * Load configuration from JSON file (future implementation)
   * Currently returns hardcoded default configuration
   * 
   * TODO: Implement actual file loading when needed:
   * 1. Read from local file system or fetch from URL
   * 2. Parse JSON content
   * 3. Validate against schema
   * 4. Merge with defaults for missing values
   */
  static async loadConfig(source?: string): Promise<QueueConfig> {
    // For now, always return default config
    return this.config
  }

  /**
   * Validate a configuration object against the schema
   */
  static validateConfig(config: unknown): QueueConfig {
    try {
      return QueueConfigSchema.parse(config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid queue configuration: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): QueueConfig {
    return this.config
  }

  /**
   * Update configuration (for testing or runtime changes)
   */
  static setConfig(config: QueueConfig): void {
    this.config = this.validateConfig(config)
  }

  /**
   * Reset to default configuration
   */
  static resetConfig(): void {
    this.config = DEFAULT_QUEUE_CONFIG
  }

  /**
   * Get queue configuration by type
   */
  static getQueueConfig(type: ProcessingModeType): QueueItem | undefined {
    return this.config.queues.find(q => q.type === type)
  }

  /**
   * Check if a feature is enabled globally
   */
  static isFeatureEnabled(feature: keyof NonNullable<QueueConfig['globalSettings']>): boolean {
    return this.config.globalSettings?.[feature] ?? false
  }
}

// Export a singleton instance for convenience
export const queueConfig = QueueConfigLoader