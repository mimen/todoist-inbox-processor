#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let devProcess = null;
let shouldRestart = false;

function cleanNextCache() {
  console.log('🧹 Cleaning .next cache...');
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
}

function startDevServer() {
  if (devProcess) {
    devProcess.kill();
  }

  console.log('🚀 Starting Next.js dev server...');
  devProcess = spawn('npm', ['run', 'dev:next'], {
    stdio: 'pipe',
    shell: true
  });

  devProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Check for build manifest errors
    if (output.includes('app-build-manifest.json') || 
        output.includes('_buildManifest.js') ||
        output.includes('ENOENT') && output.includes('.next')) {
      console.log('\n⚠️  Build cache corruption detected, restarting with clean cache...');
      shouldRestart = true;
      devProcess.kill();
    }
  });

  devProcess.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);

    // Check for build manifest errors in stderr too
    if (output.includes('app-build-manifest.json') || 
        output.includes('_buildManifest.js') ||
        output.includes('ENOENT') && output.includes('.next')) {
      console.log('\n⚠️  Build cache corruption detected, restarting with clean cache...');
      shouldRestart = true;
      devProcess.kill();
    }
  });

  devProcess.on('close', (code) => {
    if (shouldRestart) {
      shouldRestart = false;
      cleanNextCache();
      setTimeout(() => startDevServer(), 1000);
    } else if (code !== 0 && code !== null) {
      console.log(`\n❌ Dev server exited with code ${code}`);
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping dev server...');
  if (devProcess) {
    devProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (devProcess) {
    devProcess.kill();
  }
  process.exit(0);
});

// Start the server
console.log('🔧 Starting auto-cleaning dev server...');
startDevServer();