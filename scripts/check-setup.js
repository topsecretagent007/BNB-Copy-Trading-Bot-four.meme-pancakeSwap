#!/usr/bin/env node

/**
 * Setup Checker for BNB Copy Trading Bot
 * Verifies that all requirements are met before running the bot
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking bot setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check Node.js version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (Need >= 18.0.0)\n`);
  hasErrors = true;
}

// Check if .env file exists
console.log('2. Checking .env file...');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists\n');
  
  // Load and check .env contents
  require('dotenv').config();
  
  console.log('3. Checking required environment variables...');
  const required = [
    'PRIVATE_KEY',
    'WALLET_ADDRESS',
    'TARGET_WALLETS',
    'BSC_RPC_URL'
  ];
  
  for (const key of required) {
    if (process.env[key] && process.env[key] !== `your_${key.toLowerCase()}_here` && process.env[key] !== '0x0000000000000000000000000000000000000000') {
      console.log(`   ✅ ${key}`);
    } else {
      console.log(`   ❌ ${key} not configured`);
      hasErrors = true;
    }
  }
  console.log('');
  
  // Check optional Telegram config
  console.log('4. Checking Telegram configuration...');
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    console.log('   ✅ Telegram notifications enabled\n');
  } else {
    console.log('   ⚠️  Telegram not configured (optional)\n');
    hasWarnings = true;
  }
  
} else {
  console.log('   ❌ .env file not found\n');
  console.log('   💡 Run: cp .env.example .env\n');
  hasErrors = true;
}

// Check if dependencies are installed
console.log('5. Checking dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ Dependencies installed\n');
} else {
  console.log('   ❌ Dependencies not installed\n');
  console.log('   💡 Run: npm install\n');
  hasErrors = true;
}

// Check if TypeScript is compiled
console.log('6. Checking build...');
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('   ✅ Project compiled\n');
} else {
  console.log('   ⚠️  Project not compiled\n');
  console.log('   💡 Run: npm run build\n');
  hasWarnings = true;
}

// Summary
console.log('═'.repeat(50));
if (hasErrors) {
  console.log('❌ Setup incomplete - please fix errors above');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup complete with warnings');
  console.log('✅ You can proceed, but consider fixing warnings');
  process.exit(0);
} else {
  console.log('✅ Setup complete! Ready to start the bot');
  console.log('\n🚀 Start the bot with: npm start');
  process.exit(0);
}

