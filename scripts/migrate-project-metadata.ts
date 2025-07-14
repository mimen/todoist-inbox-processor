#!/usr/bin/env tsx

/**
 * Migration script to convert old project description tasks to new project-metadata format
 * 
 * Old format:
 * - Content: "{description text}" (no * prefix)
 * - Labels: ["project description"]
 * - Priority: 1 (P4)
 * 
 * New format:
 * - Content: "{project name}"
 * - Description: "{description text}"
 * - Labels: ["project-metadata"]
 * - Priority: unchanged
 */

import { TodoistApiClient } from '../lib/todoist-api'

interface MigrationResult {
  projectId: string
  projectName: string
  success: boolean
  action: 'migrated' | 'skipped' | 'error'
  details: string
}

async function migrateProjectMetadata(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []
  
  try {
    console.log('🚀 Starting project metadata migration...')
    
    // Get all projects
    const projects = await TodoistApiClient.getProjects()
    console.log(`📁 Found ${projects.length} projects`)
    
    for (const project of projects) {
      console.log(`\n🔍 Processing project: ${project.name} (${project.id})`)
      
      try {
        // Get all tasks in this project
        const tasks = await TodoistApiClient.getProjectTasks(project.id)
        
        // Find old description task (has "project description" label)
        const oldDescriptionTask = tasks.find(task => 
          task.labels.includes('project description')
        )
        
        // Find new metadata task (has "project-metadata" label)
        const newMetadataTask = tasks.find(task => 
          task.labels.includes('project-metadata')
        )
        
        if (newMetadataTask) {
          // Already migrated
          results.push({
            projectId: project.id,
            projectName: project.name,
            success: true,
            action: 'skipped',
            details: 'Already has project-metadata task'
          })
          console.log('  ✅ Already migrated - has project-metadata task')
          continue
        }
        
        if (!oldDescriptionTask) {
          // No description to migrate
          results.push({
            projectId: project.id,
            projectName: project.name,
            success: true,
            action: 'skipped',
            details: 'No old description task found'
          })
          console.log('  ⏭️  No old description task to migrate')
          continue
        }
        
        // Extract description from old task content
        const description = oldDescriptionTask.content.trim()
        console.log(`  📝 Found description: "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}"`)
        
        // Create new metadata task
        console.log('  🔄 Creating new project-metadata task...')
        await TodoistApiClient.createTask(project.name, {
          projectId: project.id,
          description: description,
          labels: ['project-metadata'],
          priority: oldDescriptionTask.priority // Keep same priority
        })
        
        // Delete old description task
        console.log('  🗑️  Deleting old description task...')
        await TodoistApiClient.closeTask(oldDescriptionTask.id)
        
        results.push({
          projectId: project.id,
          projectName: project.name,
          success: true,
          action: 'migrated',
          details: `Migrated description: "${description.substring(0, 30)}${description.length > 30 ? '...' : ''}"`
        })
        
        console.log('  ✅ Migration completed successfully')
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        console.error(`  ❌ Error processing project ${project.name}:`, error)
        results.push({
          projectId: project.id,
          projectName: project.name,
          success: false,
          action: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return results
    
  } catch (error) {
    console.error('💥 Fatal error during migration:', error)
    throw error
  }
}

async function main() {
  try {
    console.log('🔧 Project Metadata Migration Tool')
    console.log('=====================================')
    
    // Check if TODOIST_API_KEY is set
    if (!process.env.TODOIST_API_KEY) {
      console.error('❌ TODOIST_API_KEY environment variable is required')
      process.exit(1)
    }
    
    // Run migration
    const results = await migrateProjectMetadata()
    
    // Print summary
    console.log('\n📊 MIGRATION SUMMARY')
    console.log('====================')
    
    const migrated = results.filter(r => r.action === 'migrated')
    const skipped = results.filter(r => r.action === 'skipped')
    const errors = results.filter(r => r.action === 'error')
    
    console.log(`✅ Migrated: ${migrated.length}`)
    console.log(`⏭️  Skipped: ${skipped.length}`)
    console.log(`❌ Errors: ${errors.length}`)
    console.log(`📁 Total Projects: ${results.length}`)
    
    if (migrated.length > 0) {
      console.log('\n🔄 MIGRATED PROJECTS:')
      migrated.forEach(r => {
        console.log(`  • ${r.projectName} - ${r.details}`)
      })
    }
    
    if (errors.length > 0) {
      console.log('\n❌ FAILED PROJECTS:')
      errors.forEach(r => {
        console.log(`  • ${r.projectName} - ${r.details}`)
      })
    }
    
    console.log(`\n🎉 Migration completed! ${migrated.length} projects migrated successfully.`)
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}