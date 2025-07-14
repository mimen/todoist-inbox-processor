#!/usr/bin/env tsx

/**
 * Script to add "* " prefix to project-metadata tasks that don't have it
 * 
 * This ensures all project-metadata tasks start with "* " so they appear
 * at the top of project task lists due to special sorting behavior.
 * 
 * What it does:
 * - Finds all tasks with "project-metadata" label
 * - Checks if content starts with "* "
 * - If not, adds "* " prefix to the content
 * - Updates the task content
 */

import { TodoistApiClient } from '../lib/todoist-api'

interface UpdateResult {
  projectId: string
  projectName?: string
  taskId: string
  taskContent: string
  success: boolean
  action: 'updated' | 'skipped' | 'error'
  details: string
}

async function addAsteriskPrefix(): Promise<UpdateResult[]> {
  const results: UpdateResult[] = []
  
  try {
    console.log('🌟 Starting asterisk prefix addition for project-metadata tasks...')
    
    // Get all projects
    const projects = await TodoistApiClient.getProjects()
    console.log(`📁 Found ${projects.length} projects`)
    
    let totalMetadataTasks = 0
    
    for (const project of projects) {
      console.log(`\n🔍 Processing project: ${project.name} (${project.id})`)
      
      try {
        // Get all tasks in this project
        const tasks = await TodoistApiClient.getProjectTasks(project.id)
        
        // Find all project-metadata tasks
        const metadataTasks = tasks.filter(task => 
          task.labels.includes('project-metadata')
        )
        
        if (metadataTasks.length === 0) {
          console.log('  ⏭️  No project-metadata tasks found')
          continue
        }
        
        totalMetadataTasks += metadataTasks.length
        
        for (const task of metadataTasks) {
          console.log(`  📝 Checking task: "${task.content}"`)
          
          // Check if content already starts with "* "
          if (task.content.startsWith('* ')) {
            results.push({
              projectId: project.id,
              projectName: project.name,
              taskId: task.id,
              taskContent: task.content,
              success: true,
              action: 'skipped',
              details: 'Already has * prefix'
            })
            console.log('    ✅ Already has * prefix - skipping')
            continue
          }
          
          // Add "* " prefix
          const newContent = `* ${task.content}`
          console.log(`    🔄 Adding prefix: "${newContent}"`)
          
          try {
            // Update the task content
            await TodoistApiClient.updateTask(task.id, {
              content: newContent
            })
            
            results.push({
              projectId: project.id,
              projectName: project.name,
              taskId: task.id,
              taskContent: task.content,
              success: true,
              action: 'updated',
              details: `Updated: "${task.content}" → "* ${task.content}"`
            })
            
            console.log('    ✅ Successfully added * prefix')
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
            
          } catch (taskError) {
            console.error(`    ❌ Error updating task:`, taskError)
            results.push({
              projectId: project.id,
              projectName: project.name,
              taskId: task.id,
              taskContent: task.content,
              success: false,
              action: 'error',
              details: taskError instanceof Error ? taskError.message : 'Unknown error'
            })
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing project ${project.name}:`, error)
        results.push({
          projectId: project.id,
          projectName: project.name,
          taskId: 'unknown',
          taskContent: 'unknown',
          success: false,
          action: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`\n📊 Found ${totalMetadataTasks} total project-metadata tasks across all projects`)
    return results
    
  } catch (error) {
    console.error('💥 Fatal error during asterisk prefix addition:', error)
    throw error
  }
}

async function main() {
  try {
    console.log('🌟 Project Metadata Asterisk Prefix Tool')
    console.log('=========================================')
    
    // Check if TODOIST_API_KEY is set
    if (!process.env.TODOIST_API_KEY) {
      console.error('❌ TODOIST_API_KEY environment variable is required')
      process.exit(1)
    }
    
    // Run the prefix addition
    const results = await addAsteriskPrefix()
    
    // Print summary
    console.log('\n📊 ASTERISK PREFIX SUMMARY')
    console.log('===========================')
    
    const updated = results.filter(r => r.action === 'updated')
    const skipped = results.filter(r => r.action === 'skipped')
    const errors = results.filter(r => r.action === 'error')
    
    console.log(`🌟 Updated: ${updated.length}`)
    console.log(`⏭️  Skipped: ${skipped.length}`)
    console.log(`❌ Errors: ${errors.length}`)
    console.log(`📝 Total Tasks: ${results.length}`)
    
    if (updated.length > 0) {
      console.log('\n🌟 UPDATED TASKS:')
      updated.forEach(r => {
        console.log(`  • ${r.projectName}: ${r.details}`)
      })
    }
    
    if (skipped.length > 0) {
      console.log('\n⏭️  SKIPPED TASKS:')
      skipped.forEach(r => {
        console.log(`  • ${r.projectName}: "${r.taskContent}" (${r.details})`)
      })
    }
    
    if (errors.length > 0) {
      console.log('\n❌ FAILED TASKS:')
      errors.forEach(r => {
        console.log(`  • ${r.projectName}: ${r.details}`)
      })
    }
    
    console.log(`\n🎉 Asterisk prefix addition completed! ${updated.length} tasks updated successfully.`)
    
  } catch (error) {
    console.error('\n💥 Asterisk prefix addition failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}