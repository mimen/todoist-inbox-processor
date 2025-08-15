# Task Count Fix Explanation

## Problem
After processing tasks in the Inbox and assigning them to other projects, the Projects dropdown still showed incorrect task counts. The Inbox count didn't decrease when tasks were moved to other projects.

## Root Cause
The task counts were calculated based on the current `projectId` of each task in `allTasksGlobal`. When a task is moved from Inbox to another project:
1. The task's `projectId` is updated to the new project
2. The task is now counted in the NEW project
3. But the Inbox count doesn't know that this task was originally from there

## Solution
We implemented real-time computation from the master source by:

1. **Tracking Original Project IDs**: When loading tasks into a queue, we now store the original project ID of each task:
   ```typescript
   // In useQueueManagement.ts
   const newOriginalProjectIds: Record<string, string> = {}
   tasks.forEach(task => {
     newOriginalProjectIds[task.id] = task.projectId
   })
   ```

2. **Enhanced Task Count Calculation**: Modified `getTaskCountsForProjects` to consider:
   - Tasks that were originally from a project but have been processed (exclude them)
   - Tasks currently in a project that weren't part of the queue (include them)
   
   ```typescript
   // If this task was originally from this project and has been processed, exclude it
   if (originalProjectIds[task.id] === projectId && processedTaskIds.includes(task.id)) {
     return false;
   }
   ```

3. **Pass Queue Context**: The TaskProcessor now passes `processedTaskIds` and `originalProjectIds` to the count calculation:
   ```typescript
   taskCounts={getTaskCountsForProjects(
     globallyFilteredTasks, 
     projects.map(p => p.id), 
     'all', 
     currentUserId,
     processedTaskIds,
     originalProjectIds
   )}
   ```

## How It Works

### Example Scenario:
1. Start with 10 tasks in Inbox
2. Process 3 tasks and assign them to "Work" project
3. The counts now show:
   - Inbox: 7 (10 original - 3 processed)
   - Work: Whatever was there before + 3 new tasks

### Data Flow:
```
Queue Load → Track Original IDs → Process Tasks → Update Counts
     ↓              ↓                    ↓              ↓
  10 tasks    {task1: inbox}    task1→work    Inbox: 10-1=9
```

This solution follows the "data down, actions up" principle by computing counts in real-time from the master task source without creating additional tracking variables.