# Todoist Sync API Integration Plan

## Overview

This document outlines the plan to integrate Todoist's Sync API into our existing sync token architecture, building upon the foundation established with Google Calendar sync.

## Todoist Sync API Basics

### Key Concepts

The Todoist Sync API works similarly to Google Calendar's incremental sync:

1. **Sync Token**: A string representing the state of data at a specific point
2. **Incremental Updates**: Fetch only changes since the last sync token
3. **Resource Types**: Items (tasks), projects, labels, sections, notes, etc.
4. **Commands**: Batch operations for creating/updating/deleting resources

### API Structure

```typescript
// Todoist Sync API Request
interface TodoistSyncRequest {
  sync_token: string      // '*' for full sync
  resource_types: string[] // ['items', 'projects', 'labels']
  commands?: Command[]     // Optional batch commands
}

// Todoist Sync API Response
interface TodoistSyncResponse {
  sync_token: string      // New sync token
  items?: TodoistTask[]   // Changed tasks
  projects?: Project[]    // Changed projects
  labels?: Label[]        // Changed labels
  // ... other resource types
}
```

## Integration Architecture

### 1. Todoist Sync Service

```typescript
class TodoistSyncService {
  private redis: RedisClient
  private syncInterval = 5 * 60 * 1000 // 5 minutes (more frequent than calendar)
  
  async startBackgroundSync(): Promise<void> {
    // Initial sync on startup
    await this.performFullSync()
    
    // Periodic incremental sync
    setInterval(() => this.performIncrementalSync(), this.syncInterval)
  }
  
  async performFullSync(): Promise<void> {
    const response = await todoistApi.sync({
      sync_token: '*',
      resource_types: ['items', 'projects', 'labels', 'sections']
    })
    
    await this.processAndStoreSyncData(response)
  }
  
  async performIncrementalSync(): Promise<void> {
    const currentToken = await this.redis.get('todoist:syncToken')
    
    if (!currentToken) {
      return this.performFullSync()
    }
    
    try {
      const response = await todoistApi.sync({
        sync_token: currentToken,
        resource_types: ['items', 'projects', 'labels', 'sections']
      })
      
      await this.processIncrementalChanges(response)
      await this.redis.set('todoist:syncToken', response.sync_token)
      
    } catch (error) {
      if (error.message.includes('Invalid sync token')) {
        // Token expired or invalid, perform full sync
        await this.performFullSync()
      }
    }
  }
}
```

### 2. Redis Storage Schema

```typescript
// Todoist data structure in Redis
interface TodoistSyncData {
  syncToken: string
  lastSync: number
  lastFullSync: number
  
  // Normalized data storage
  tasks: Map<string, TodoistTask>
  projects: Map<string, Project>
  labels: Map<string, Label>
  sections: Map<string, Section>
  
  // Relationship indices
  projectTasks: Map<string, string[]>      // projectId -> taskIds
  labelTasks: Map<string, string[]>        // labelId -> taskIds
  sectionTasks: Map<string, string[]>      // sectionId -> taskIds
}

// Redis key structure
const REDIS_KEYS = {
  syncToken: 'todoist:syncToken',
  lastSync: 'todoist:lastSync',
  tasks: 'todoist:tasks',              // Hash of taskId -> task JSON
  projects: 'todoist:projects',        // Hash of projectId -> project JSON
  labels: 'todoist:labels',            // Hash of labelId -> label JSON
  taskIndices: 'todoist:indices:tasks' // Indices for fast lookups
}
```

### 3. Global Todoist Store

```typescript
class TodoistStore {
  private tasks = new Map<string, TodoistTask>()
  private projects = new Map<string, Project>()
  private labels = new Map<string, Label>()
  private subscribers = new Set<() => void>()
  
  async initialize(): Promise<void> {
    // Load from Redis on startup
    await this.loadFromRedis()
    
    // Subscribe to Redis pub/sub for real-time updates
    await this.subscribeToUpdates()
  }
  
  // Fast in-memory queries
  getTasksForProject(projectId: string): TodoistTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.project_id === projectId)
  }
  
  getTasksWithLabel(labelId: string): TodoistTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.labels.includes(labelId))
  }
  
  getInboxTasks(): TodoistTask[] {
    return Array.from(this.tasks.values())
      .filter(task => !task.project_id || task.project_id === this.getInboxProjectId())
  }
  
  // Real-time subscriptions
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
}
```

### 4. Change Processing

```typescript
class TodoistChangeProcessor {
  async processIncrementalChanges(syncResponse: TodoistSyncResponse) {
    const changes = {
      created: [] as string[],
      updated: [] as string[],
      deleted: [] as string[]
    }
    
    // Process task changes
    if (syncResponse.items) {
      for (const item of syncResponse.items) {
        if (item.is_deleted) {
          await this.deleteTask(item.id)
          changes.deleted.push(item.id)
        } else if (await this.taskExists(item.id)) {
          await this.updateTask(item)
          changes.updated.push(item.id)
        } else {
          await this.createTask(item)
          changes.created.push(item.id)
        }
      }
    }
    
    // Process project changes
    if (syncResponse.projects) {
      await this.processProjectChanges(syncResponse.projects)
    }
    
    // Emit change events
    await this.emitChangeEvents(changes)
  }
  
  private async emitChangeEvents(changes: ChangeSet) {
    // Publish to Redis pub/sub for real-time updates
    await redis.publish('todoist:changes', JSON.stringify(changes))
  }
}
```

## Integration with Existing Architecture

### 1. Unified Sync Manager

```typescript
class UnifiedSyncManager {
  private calendarSync: CalendarSyncService
  private todoistSync: TodoistSyncService
  
  async initialize() {
    // Initialize both sync services
    await Promise.all([
      this.calendarSync.startBackgroundSync(),
      this.todoistSync.startBackgroundSync()
    ])
  }
  
  async getSyncStatus(): Promise<UnifiedSyncStatus> {
    const [calendarStatus, todoistStatus] = await Promise.all([
      this.calendarSync.getStatus(),
      this.todoistSync.getStatus()
    ])
    
    return {
      calendar: calendarStatus,
      todoist: todoistStatus,
      overall: this.calculateOverallStatus(calendarStatus, todoistStatus)
    }
  }
}
```

### 2. Enhanced useCalendarEvents Hook

```typescript
// Extended to include Todoist tasks on calendar
export function useCalendarEvents(date: Date, daysToLoad: number = 3) {
  const calendarEvents = useCalendarStore(date, daysToLoad)
  const todoistTasks = useTodoistStore(date, daysToLoad)
  
  // Convert Todoist tasks with due dates to calendar events
  const taskEvents = useMemo(() => {
    return todoistTasks
      .filter(task => task.due?.date)
      .map(task => ({
        id: `todoist-${task.id}`,
        calendarId: 'todoist',
        calendarName: 'Todoist Tasks',
        title: task.content,
        start: new Date(task.due.date),
        end: new Date(task.due.date),
        color: '#E44332', // Todoist red
        isAllDay: !task.due.datetime,
        metadata: { type: 'todoist-task', taskId: task.id }
      }))
  }, [todoistTasks])
  
  // Merge calendar events and Todoist tasks
  const allEvents = useMemo(() => {
    return [...calendarEvents, ...taskEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    )
  }, [calendarEvents, taskEvents])
  
  return { events: allEvents, loading, error, authRequired }
}
```

### 3. Sync Status UI Updates

```typescript
// Enhanced sync status component
function SyncStatus() {
  const { calendar, todoist } = useUnifiedSyncStatus()
  
  return (
    <div className="flex items-center gap-4">
      {/* Calendar sync status */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4" />
        {calendar.syncInProgress ? (
          <Spinner />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        <span className="text-sm">
          Calendar: {formatSyncTime(calendar.lastSync)}
        </span>
      </div>
      
      {/* Todoist sync status */}
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4" />
        {todoist.syncInProgress ? (
          <Spinner />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        <span className="text-sm">
          Tasks: {formatSyncTime(todoist.lastSync)}
        </span>
      </div>
    </div>
  )
}
```

## Performance Optimizations

### 1. Selective Sync

```typescript
// Only sync active projects and recent tasks
interface SelectiveSyncConfig {
  // Time-based filtering
  syncTasksFromDays: 30      // Only sync tasks from last 30 days
  syncTasksUntilDays: 90     // Only sync tasks due in next 90 days
  
  // Project filtering
  excludeArchivedProjects: true
  excludeDeletedProjects: true
  
  // Smart filtering based on usage
  priorityProjects: string[]  // Always sync these projects
  recentlyUsedProjects: string[] // Projects accessed in last 7 days
}
```

### 2. Incremental Loading

```typescript
// Load data progressively based on user needs
class ProgressiveDataLoader {
  async loadInitialData() {
    // Load only inbox and today's tasks initially
    const criticalData = await this.loadCriticalTasks()
    
    // Load rest in background
    this.loadRemainingDataInBackground()
  }
  
  private async loadCriticalTasks() {
    return {
      inbox: await this.loadInboxTasks(),
      today: await this.loadTodayTasks(),
      overdue: await this.loadOverdueTasks()
    }
  }
}
```

### 3. Change Coalescence

```typescript
// Batch rapid changes to reduce updates
class ChangeCoalescer {
  private pendingChanges = new Map<string, PendingChange>()
  private flushTimeout: NodeJS.Timeout | null = null
  
  addChange(resourceType: string, resourceId: string, change: any) {
    const key = `${resourceType}:${resourceId}`
    
    // Merge with pending changes
    if (this.pendingChanges.has(key)) {
      this.pendingChanges.get(key)!.merge(change)
    } else {
      this.pendingChanges.set(key, new PendingChange(change))
    }
    
    // Debounce flush
    this.scheduleFlush()
  }
  
  private scheduleFlush() {
    if (this.flushTimeout) clearTimeout(this.flushTimeout)
    
    this.flushTimeout = setTimeout(() => {
      this.flush()
    }, 500) // Wait 500ms for changes to settle
  }
}
```

## Migration Path

### Phase 1: Read-Only Integration (Month 1)
- Implement Todoist sync service
- Store tasks in Redis alongside calendar events
- Display Todoist tasks in calendar view
- No modifications through our app yet

### Phase 2: Bidirectional Sync (Month 2)
- Implement command queue for Todoist updates
- Handle conflict resolution
- Add optimistic updates with rollback
- Enable task modifications through our UI

### Phase 3: Advanced Features (Month 3)
- Real-time sync via webhooks
- Offline support with sync queue
- Batch operations optimization
- Performance monitoring and tuning

## Benefits of Unified Sync Architecture

1. **Consistency**: Same sync pattern for both calendar and tasks
2. **Performance**: ~95% reduction in API calls after initial sync
3. **Reliability**: Automatic recovery from sync failures
4. **Scalability**: Foundation for adding more sync providers
5. **User Experience**: Instant data access from memory
6. **Offline Support**: Redis cache enables offline viewing

## Monitoring and Observability

```typescript
// Unified metrics for both sync services
interface SyncMetrics {
  // Performance
  syncDuration: Histogram         // Time to complete sync
  apiCalls: Counter              // Number of API calls made
  dataSynced: Counter            // Number of items synced
  
  // Reliability
  syncFailures: Counter          // Failed sync attempts
  tokenInvalidations: Counter    // Sync token resets
  conflictsResolved: Counter     // Data conflicts handled
  
  // Business metrics
  activeUsers: Gauge             // Users with recent syncs
  totalTasks: Gauge              // Total tasks in system
  totalEvents: Gauge             // Total calendar events
}
```

## Conclusion

Integrating Todoist's Sync API into our existing architecture will provide:

1. **Unified Experience**: Tasks and calendar events in one view
2. **Real-time Updates**: Changes reflect immediately across all clients
3. **Efficient Syncing**: Minimal API usage through incremental updates
4. **Offline Capability**: Full functionality even without internet
5. **Scalable Foundation**: Easy to add more productivity tools

The sync token architecture proven with Google Calendar will translate directly to Todoist, creating a robust, efficient system for managing both time and tasks.