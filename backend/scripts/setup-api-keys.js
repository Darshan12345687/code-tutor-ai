#!/usr/bin/env node

/**
 * Interactive API Key Setup Script
 * Helps configure API keys for AI model training
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🚀 CodeTutor AI API Key Setup\n', 'blue');
  log('This script will help you configure API keys for AI model training.\n', 'cyan');
  log('At least one of Mistral AI or Google Gemini is required.\n', 'yellow');

  const envPath = join(__dirname, '..', '.env');
  const envExamplePath = join(__dirname, '..', '.env.example');

  // Check if .env exists
  let envContent = '';
  if (existsSync(envPath)) {
    log('📄 Found existing .env file. Current values will be preserved.\n', 'cyan');
    envContent = readFileSync(envPath, 'utf-8');
  } else if (existsSync(envExamplePath)) {
    log('📄 Creating .env from .env.example template...\n', 'cyan');
    envContent = readFileSync(envExamplePath, 'utf-8');
  } else {
    log('⚠️  No .env.example found. Creating basic .env template...\n', 'yellow');
    envContent = `MONGODB_URI=mongodb://localhost:27017/codetutor
PORT=8000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=30d
NODE_ENV=development

# AI Provider API Keys
MISTRAL_API_KEY=
GOOGLE_AI_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4
HUGGING_FACE_API_KEY=
`;
  }

  // Parse existing values
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  });

  log('='.repeat(60), 'cyan');
  log('\n📝 API Key Configuration\n', 'blue');

  // Mistral AI
  log('\n1️⃣  Mistral AI (Primary - Recommended)', 'yellow');
  log('   Get your key: https://console.mistral.ai/', 'cyan');
  const mistralKey = await question(
    `   Mistral API Key${envVars.MISTRAL_API_KEY ? ' (current: ' + envVars.MISTRAL_API_KEY.substring(0, 10) + '...)' : ''} [Enter to skip]: `
  );
  if (mistralKey.trim()) {
    envVars.MISTRAL_API_KEY = mistralKey.trim();
    log('   ✅ Mistral API key saved\n', 'green');
  } else if (envVars.MISTRAL_API_KEY) {
    log('   ℹ️  Keeping existing Mistral API key\n', 'cyan');
  }

  // Google Gemini
  log('2️⃣  Google Gemini (Secondary - Recommended)', 'yellow');
  log('   Get your key: https://makersuite.google.com/app/apikey', 'cyan');
  const geminiKey = await question(
    `   Google Gemini API Key${envVars.GOOGLE_AI_API_KEY ? ' (current: ' + envVars.GOOGLE_AI_API_KEY.substring(0, 10) + '...)' : ''} [Enter to skip]: `
  );
  if (geminiKey.trim()) {
    envVars.GOOGLE_AI_API_KEY = geminiKey.trim();
    log('   ✅ Google Gemini API key saved\n', 'green');
  } else if (envVars.GOOGLE_AI_API_KEY) {
    log('   ℹ️  Keeping existing Google Gemini API key\n', 'cyan');
  }

  // OpenAI (Optional)
  log('3️⃣  OpenAI (Optional)', 'yellow');
  log('   Get your key: https://platform.openai.com/api-keys', 'cyan');
  const openaiKey = await question(
    `   OpenAI API Key${envVars.OPENAI_API_KEY ? ' (current: ' + envVars.OPENAI_API_KEY.substring(0, 10) + '...)' : ''} [Enter to skip]: `
  );
  if (openaiKey.trim()) {
    envVars.OPENAI_API_KEY = openaiKey.trim();
    log('   ✅ OpenAI API key saved\n', 'green');
  } else if (envVars.OPENAI_API_KEY) {
    log('   ℹ️  Keeping existing OpenAI API key\n', 'cyan');
  }

  // Hugging Face (Optional)
  log('4️⃣  Hugging Face (Optional)', 'yellow');
  log('   Get your key: https://huggingface.co/settings/tokens', 'cyan');
  const hfKey = await question(
    `   Hugging Face API Key${envVars.HUGGING_FACE_API_KEY ? ' (current: ' + envVars.HUGGING_FACE_API_KEY.substring(0, 10) + '...)' : ''} [Enter to skip]: `
  );
  if (hfKey.trim()) {
    envVars.HUGGING_FACE_API_KEY = hfKey.trim();
    log('   ✅ Hugging Face API key saved\n', 'green');
  } else if (envVars.HUGGING_FACE_API_KEY) {
    log('   ℹ️  Keeping existing Hugging Face API key\n', 'cyan');
  }

  // Reconstruct .env file
  const newEnvContent = `# CodeTutor Backend Environment Configuration
# Generated/Updated by setup-api-keys.js

# ============================================
# Database Configuration
# ============================================
MONGODB_URI=${envVars.MONGODB_URI || 'mongodb://localhost:27017/codetutor'}
PORT=${envVars.PORT || '8000'}

# ============================================
# Authentication & Security
# ============================================
JWT_SECRET=${envVars.JWT_SECRET || 'your-secret-key-change-in-production'}
JWT_EXPIRE=${envVars.JWT_EXPIRE || '30d'}

# ============================================
# AI Provider API Keys (Required for Training)
# ============================================
# These API keys are used to train and configure AI models
# to provide proper output and feedback to users

# Primary AI Provider - Mistral AI (Recommended)
# Get your API key from: https://console.mistral.ai/
MISTRAL_API_KEY=${envVars.MISTRAL_API_KEY || ''}

# Secondary AI Provider - Google Gemini (Recommended)
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_AI_API_KEY=${envVars.GOOGLE_AI_API_KEY || ''}

# Optional AI Providers
# OpenAI (Optional - for enhanced features)
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=${envVars.OPENAI_API_KEY || ''}
OPENAI_MODEL=${envVars.OPENAI_MODEL || 'gpt-4'}

# Hugging Face (Optional - free tier available)
# Get your API key from: https://huggingface.co/settings/tokens
HUGGING_FACE_API_KEY=${envVars.HUGGING_FACE_API_KEY || ''}

# ============================================
# Environment
# ============================================
NODE_ENV=${envVars.NODE_ENV || 'development'}
`;

  // Write .env file
  writeFileSync(envPath, newEnvContent);
  log('\n' + '='.repeat(60), 'cyan');
  log('\n✅ Configuration saved to .env file!\n', 'green');

  // Check if at least one required key is set
  const hasRequired = !!(envVars.MISTRAL_API_KEY || envVars.GOOGLE_AI_API_KEY);
  
  if (!hasRequired) {
    log('⚠️  WARNING: No required API keys configured!', 'yellow');
    log('At least one of Mistral AI or Google Gemini is required for AI features.\n', 'yellow');
  } else {
    log('✅ At least one required provider is configured.\n', 'green');
  }

  log('📋 Next Steps:\n', 'blue');
  log('1. Validate your API keys:', 'cyan');
  log('   npm run validate-keys\n', 'cyan');
  log('2. Start the server:', 'cyan');
  log('   npm start\n', 'cyan');
  log('3. Test AI features:', 'cyan');
  log('   curl http://localhost:8000/api/ai/providers\n', 'cyan');

  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});





