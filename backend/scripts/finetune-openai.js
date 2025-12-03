#!/usr/bin/env node

/**
 * OpenAI Fine-tuning Script
 * Automates the fine-tuning process for CodeTutor AI
 */

import { readFileSync, existsSync, createReadStream, writeFileSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Try to import OpenAI Node.js SDK
let OpenAI;
try {
  OpenAI = (await import('openai')).default;
} catch (error) {
  OpenAI = null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkOpenAICLI() {
  try {
    execSync('which openai', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    log('❌ OPENAI_API_KEY not set in .env file', 'red');
    return false;
  }
  return true;
}

async function uploadDataset(filePath) {
  log('\n📤 Uploading dataset to OpenAI...\n', 'blue');
  
  // Use Node.js SDK if available
  if (OpenAI) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      log('   Uploading file...', 'cyan');
      const file = await openai.files.create({
        file: createReadStream(filePath),
        purpose: 'fine-tune'
      });
      
      log(`✅ Dataset uploaded! File ID: ${file.id}`, 'green');
      log(`   Status: ${file.status}`, 'cyan');
      return file.id;
    } catch (error) {
      log(`❌ Error uploading dataset: ${error.message}`, 'red');
      // Fall through to manual instructions
    }
  }
  
  // Fallback: provide manual instructions
  log('\n💡 Manual upload required:', 'yellow');
  log('   1. Install OpenAI Node.js SDK:', 'cyan');
  log('      npm install openai', 'cyan');
  log('   2. Or upload manually:', 'cyan');
  log('      - Go to https://platform.openai.com/finetune', 'cyan');
  log(`      - Upload: ${filePath}`, 'cyan');
  log('      - Copy the file ID', 'cyan');
  log('\n   Then run this script again with the file ID:', 'yellow');
  log('   node scripts/finetune-openai.js <file-id>', 'cyan');
  
  return null;
}

async function createFineTuneJob(fileId, model = 'gpt-3.5-turbo', suffix = 'codetutor-beginner') {
  log('\n🚀 Creating fine-tuning job...\n', 'blue');
  
  // Use Node.js SDK if available
  if (OpenAI) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      log(`Creating fine-tuning job with file: ${fileId}`, 'cyan');
      const fineTune = await openai.fineTuning.jobs.create({
        training_file: fileId,
        model: model,
        suffix: suffix
      });
      
      log(`✅ Fine-tuning job created! Job ID: ${fineTune.id}`, 'green');
      log(`   Status: ${fineTune.status}`, 'cyan');
      log(`   Model: ${fineTune.model}`, 'cyan');
      return fineTune.id;
    } catch (error) {
      log(`❌ Error creating fine-tuning job: ${error.message}`, 'red');
      // Fall through to manual instructions
    }
  }
  
  // Fallback: provide manual instructions
  log('\n💡 Manual fine-tuning required:', 'yellow');
  log('   1. Install OpenAI Node.js SDK:', 'cyan');
  log('      npm install openai', 'cyan');
  log('   2. Or create manually:', 'cyan');
  log('      - Go to https://platform.openai.com/finetune', 'cyan');
  log(`      - File ID: ${fileId}`, 'cyan');
  log(`      - Model: ${model}`, 'cyan');
  log(`      - Suffix: ${suffix}`, 'cyan');
  
  return null;
}

async function monitorJob(jobId) {
  log('\n📊 Monitoring fine-tuning job...\n', 'blue');
  log('💡 This may take 10-30 minutes. You can check status with:', 'yellow');
  log(`   openai api fine_tunes.get -i ${jobId}`, 'cyan');
  log('\nOr follow progress with:', 'yellow');
  log(`   openai api fine_tunes.follow -i ${jobId}`, 'cyan');
  
  // Try to get initial status
  try {
    const output = execSync(
      `openai api fine_tunes.get -i ${jobId}`,
      { encoding: 'utf-8', stdio: 'pipe', shell: '/bin/bash' }
    );
    console.log(output);
  } catch (error) {
    log('⚠️  Could not get job status (this is normal if job just started)', 'yellow');
  }
}

async function main() {
  log('\n🎯 OpenAI Fine-tuning for CodeTutor AI\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  // Check prerequisites
  log('\n🔍 Checking prerequisites...\n', 'blue');
  
  if (!OpenAI) {
    log('⚠️  OpenAI Node.js SDK not found', 'yellow');
    log('\n📥 Installing OpenAI SDK...', 'cyan');
    try {
      execSync('npm install openai', { stdio: 'inherit', cwd: join(__dirname, '..') });
      // Reload after install
      OpenAI = (await import('openai')).default;
      log('✅ OpenAI SDK installed!', 'green');
    } catch (error) {
      log('❌ Failed to install OpenAI SDK', 'red');
      log('   Please run manually: npm install openai', 'yellow');
      process.exit(1);
    }
  } else {
    log('✅ OpenAI Node.js SDK available', 'green');
  }
  
  if (!await checkAPIKey()) {
    log('\n💡 Set your API key in .env file:', 'yellow');
    log('   OPENAI_API_KEY=sk-...', 'cyan');
    process.exit(1);
  }
  log('✅ API key configured', 'green');
  
  // Check dataset file
  const datasetPath = join(__dirname, '..', 'datasets', 'openai-finetuning.jsonl');
  if (!existsSync(datasetPath)) {
    log(`❌ Dataset not found: ${datasetPath}`, 'red');
    log('\n💡 Prepare dataset first:', 'yellow');
    log('   npm run prepare-dataset', 'cyan');
    process.exit(1);
  }
  log(`✅ Dataset found: ${datasetPath}`, 'green');
  
  // Check dataset size
  const datasetContent = readFileSync(datasetPath, 'utf-8');
  const lineCount = datasetContent.trim().split('\n').length;
  log(`✅ Dataset contains ${lineCount} examples`, 'green');
  
  if (lineCount < 10) {
    log('⚠️  Warning: Dataset is very small. Fine-tuning works better with 50+ examples.', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📋 Fine-tuning Configuration\n', 'blue');
  log('Model: gpt-3.5-turbo', 'cyan');
  log('Suffix: codetutor-beginner', 'cyan');
  log(`Examples: ${lineCount}`, 'cyan');
  log('\n💰 Estimated Cost:', 'yellow');
  log('   Training: ~$0.008 per 1K tokens', 'cyan');
  log('   Usage: ~$0.002 per 1K tokens (after fine-tuning)', 'cyan');
  
  // Ask for confirmation
  log('\n⚠️  This will start a fine-tuning job that costs money.', 'yellow');
  log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n', 'yellow');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Upload dataset
  const fileId = await uploadDataset(datasetPath);
  if (!fileId) {
    log('\n❌ Failed to upload dataset', 'red');
    process.exit(1);
  }
  
  // Create fine-tuning job
  const jobId = await createFineTuneJob(fileId);
  if (!jobId) {
    log('\n❌ Failed to create fine-tuning job', 'red');
    log('💡 You may need to upload the file manually and use the file ID', 'yellow');
    process.exit(1);
  }
  
  // Monitor job
  await monitorJob(jobId);
  
  log('\n✅ Fine-tuning job started successfully!\n', 'green');
  log('📋 Next Steps:\n', 'blue');
  log('1. Wait for training to complete (10-30 minutes)', 'cyan');
  log('2. Check status:', 'cyan');
  log(`   openai api fine_tunes.get -i ${jobId}`, 'cyan');
  log('3. Once complete, update .env with your fine-tuned model:', 'cyan');
  log('   OPENAI_MODEL=ft:gpt-3.5-turbo:your-org:codetutor-beginner:xxxxx', 'cyan');
  log('4. Restart your server and test!', 'cyan');
  log('\n');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

