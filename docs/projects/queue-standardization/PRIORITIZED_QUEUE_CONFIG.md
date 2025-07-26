# Prioritized Queue Configuration Guide

The prioritized queue allows you to create a custom order of task queues, combining projects, priorities, and smart filters.

## Configuration Location

Edit the file: `/public/config/queue-config.json`

## Using Project Names

You can reference projects by their name instead of ID:

```json
{
  "type": "project",
  "value": "Work",        // Use the exact project name (case-insensitive)
  "name": "Work Tasks",   // Optional display name override
  "icon": "💼"           // Optional icon
}
```

Special project names:
- `"Inbox"` - Automatically finds your inbox project

## Queue Item Types

### 1. Projects
```json
{
  "type": "project",
  "value": "Project Name",  // Use project name (case-insensitive)
  "name": "Display Name",   // Optional
  "icon": "📁"             // Optional
}
```

### 2. Priorities
```json
{
  "type": "priority",
  "value": "4",            // 4=P1, 3=P2, 2=P3, 1=P4
  "name": "P1 Tasks",
  "icon": "🚨"
}
```

### 3. Priority Projects
Expands to show all projects with a specific priority:
```json
{
  "type": "priority-projects",
  "value": "4",            // Shows all P1 projects
  "name": "P1 Projects"
}
```

### 4. Smart Filters
```json
{
  "type": "preset",
  "value": "overdue-all",  // Filter ID
  "name": "Overdue Tasks",
  "icon": "⏰"
}
```

Available filters:
- `overdue-all` - Overdue by scheduled date OR deadline
- `today-all` - Due today by scheduled date OR deadline
- `p2-projects` - Tasks in P2 priority projects
- `daily-planning` - P1 tasks, due today, or overdue
- `priority-projects` - Tasks in P1 priority projects
- `due-projects` - Tasks in projects due this week

## Example Configuration

```json
{
  "prioritizedQueue": {
    "enabled": true,
    "sequence": [
      {
        "type": "project",
        "value": "Inbox",
        "name": "Inbox",
        "icon": "📥"
      },
      {
        "type": "preset",
        "value": "overdue-all",
        "name": "Overdue (All)",
        "icon": "⏰"
      },
      {
        "type": "priority",
        "value": "4",
        "name": "P1 Tasks",
        "icon": "🚨"
      },
      {
        "type": "project",
        "value": "Work",
        "name": "Work Project",
        "icon": "💼"
      }
    ]
  }
}
```

## Tips

1. **Project Names**: Use the exact project name as it appears in Todoist (case doesn't matter)
2. **Order Matters**: Items appear in the dropdown in the order you define them
3. **Empty Queues**: Set `hideEmpty: true` in behavior to skip empty queues
4. **Icons**: Use any emoji for visual distinction

## Troubleshooting

- **Project not found**: Check the exact spelling of the project name
- **Empty dropdown**: Ensure the configuration file is valid JSON
- **Wrong order**: The sequence array determines the exact order