#!/usr/bin/env node

/**
 * JavaScript runner for the TypeScript migration script
 * This allows running the migration without needing tsx installed globally
 */

const { spawn } = require('child_process')
const path = require('path')

async function runMigration() {
  console.log('🚀 Starting project metadata migration...')
  
  // Check if we're in the right directory
  const scriptPath = path.join(__dirname, 'migrate-project-metadata.ts')
  
  // Try to run with tsx (if available)
  const child = spawn('npx', ['tsx', scriptPath], {
    stdio: 'inherit',
    env: process.env
  })
  
  child.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: tsx not found. Please install it first:')
      console.error('   npm install -g tsx')
      console.error('   or')
      console.error('   npx tsx scripts/migrate-project-metadata.ts')
    } else {
      console.error('❌ Error running migration:', error.message)
    }
    process.exit(1)
  })
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Migration completed successfully!')
    } else {
      console.error(`❌ Migration failed with exit code ${code}`)
      process.exit(code)
    }
  })
}

runMigration()