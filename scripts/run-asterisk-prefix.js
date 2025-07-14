#!/usr/bin/env node

/**
 * JavaScript runner for the asterisk prefix addition script
 */

const { spawn } = require('child_process')
const path = require('path')

async function runAsteriskPrefix() {
  console.log('🌟 Starting asterisk prefix addition...')
  
  // Check if we're in the right directory
  const scriptPath = path.join(__dirname, 'add-asterisk-prefix.ts')
  
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
      console.error('   npx tsx scripts/add-asterisk-prefix.ts')
    } else {
      console.error('❌ Error running asterisk prefix addition:', error.message)
    }
    process.exit(1)
  })
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Asterisk prefix addition completed successfully!')
    } else {
      console.error(`❌ Asterisk prefix addition failed with exit code ${code}`)
      process.exit(code)
    }
  })
}

runAsteriskPrefix()