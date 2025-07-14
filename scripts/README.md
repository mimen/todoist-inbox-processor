# Migration Scripts

## 1. Project Metadata Migration

This script migrates old project description tasks to the new project-metadata format.

## 2. Asterisk Prefix Addition

This script adds "* " prefix to project-metadata tasks that don't have it.

### What it does:

**Old format:**
- Content: `"{description text}"` (no * prefix)
- Labels: `["project description"]`
- Priority: P4 (1)

**New format:**
- Content: `"{project name}"`
- Description: `"{description text}"`
- Labels: `["project-metadata"]`
- Priority: Same as before

### How to run:

#### Option 1: Using TypeScript directly
```bash
# From the project root
npx tsx scripts/migrate-project-metadata.ts
```

#### Option 2: Using the JavaScript runner
```bash
# From the project root
node scripts/run-migration.js
```

#### Option 3: Make executable and run
```bash
# From the project root
chmod +x scripts/migrate-project-metadata.ts
./scripts/migrate-project-metadata.ts
```

### Prerequisites:

1. **Environment**: Make sure `TODOIST_API_KEY` is set in your environment
2. **Dependencies**: The script uses the existing `TodoistApiClient` from the project

### What the script does:

1. ✅ **Safe**: Only migrates projects that haven't been migrated yet
2. 🔍 **Smart**: Checks for existing `project-metadata` tasks to avoid duplicates
3. 🗑️ **Clean**: Removes old description tasks after successful migration
4. 📊 **Detailed**: Provides comprehensive logging and summary
5. ⚡ **Rate-limited**: Includes delays to avoid API rate limits
6. 🎯 **Accurate**: Looks for tasks with `project description` label (no * prefix required)

### Output:

The script provides detailed output including:
- Progress for each project
- Summary of migrated, skipped, and failed projects
- Error details for any failures
- Total count and success rate

### Safety:

- ✅ Checks for existing metadata tasks before creating new ones
- ✅ Only processes tasks with the exact old format
- ✅ Preserves original priority settings
- ✅ Provides detailed logging for audit purposes
- ✅ Handles errors gracefully without stopping the entire migration

---

## Asterisk Prefix Addition Script

### Purpose:
Adds "* " prefix to project-metadata tasks that don't have it, ensuring they appear at the top of project task lists.

### How to run:

#### Option 1: Using TypeScript directly
```bash
npx tsx scripts/add-asterisk-prefix.ts
```

#### Option 2: Using the JavaScript runner
```bash
node scripts/run-asterisk-prefix.js
```

#### Option 3: Make executable and run
```bash
./scripts/add-asterisk-prefix.ts
```

### What it does:

1. 🔍 **Finds**: All tasks with `project-metadata` label
2. ✅ **Checks**: If content starts with "* "
3. 🌟 **Updates**: Adds "* " prefix if missing
4. ⏭️ **Skips**: Tasks that already have the prefix
5. 📊 **Reports**: Detailed summary of updates

### Example transformation:
- **Before**: `"Website Redesign"` 
- **After**: `"* Website Redesign"`

### Safety features:
- ✅ Only updates tasks that need it
- ✅ Preserves all other task properties
- ✅ Rate-limited to avoid API issues
- ✅ Detailed logging for audit trail
- ✅ Error handling for individual failures