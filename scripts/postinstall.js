#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in development with local task package
const localTaskPath = path.resolve(__dirname, '../../task');
const nodeModulesTaskPath = path.resolve(__dirname, '../node_modules/@just-every/task');

if (fs.existsSync(localTaskPath) && fs.existsSync(path.join(localTaskPath, 'package.json'))) {
  console.log('📦 Found local @just-every/task package, creating symlink...');
  
  try {
    // Remove existing task package in node_modules if it exists
    if (fs.existsSync(nodeModulesTaskPath)) {
      fs.rmSync(nodeModulesTaskPath, { recursive: true, force: true });
    }
    
    // Ensure @just-every directory exists
    const justEveryDir = path.dirname(nodeModulesTaskPath);
    if (!fs.existsSync(justEveryDir)) {
      fs.mkdirSync(justEveryDir, { recursive: true });
    }
    
    // Create symlink to local task package
    fs.symlinkSync(localTaskPath, nodeModulesTaskPath, 'junction');
    console.log('✅ Successfully linked local @just-every/task package');
  } catch (error) {
    console.error('❌ Error creating symlink:', error.message);
    console.log('   You may need to run npm install in the task directory first');
  }
} else {
  console.log('📦 Using published @just-every/task package');
}