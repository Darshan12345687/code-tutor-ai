#!/usr/bin/env node

/**
 * Hugging Face Fine-tuning Setup
 * Hugging Face offers free fine-tuning for many models
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

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

async function main() {
  log('\n🤗 Hugging Face Fine-tuning Setup\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  log('\n📋 Free Fine-tuning Options:\n', 'blue');
  
  log('1. Hugging Face Spaces (Free)', 'green');
  log('   - Create a Space with fine-tuning notebook', 'cyan');
  log('   - Use free GPU resources', 'cyan');
  log('   - Models: GPT-2, T5, BERT, etc.', 'cyan');
  log('   - Guide: https://huggingface.co/docs/transformers/training', 'cyan');
  
  log('\n2. Google Colab (Free)', 'green');
  log('   - Free GPU access (T4, limited hours)', 'cyan');
  log('   - Fine-tune models like GPT-2, T5', 'cyan');
  log('   - Upload your dataset', 'cyan');
  log('   - Guide: https://colab.research.google.com/', 'cyan');
  
  log('\n3. Kaggle Notebooks (Free)', 'green');
  log('   - Free GPU (30 hours/week)', 'cyan');
  log('   - Fine-tune transformer models', 'cyan');
  log('   - Guide: https://www.kaggle.com/docs/notebooks', 'cyan');
  
  const datasetPath = join(__dirname, '..', 'datasets', 'merged-dataset.jsonl');
  
  if (existsSync(datasetPath)) {
    log('\n✅ Dataset ready:', 'green');
    log(`   ${datasetPath}`, 'cyan');
    log('\n📝 To fine-tune on Hugging Face:', 'blue');
    log('   1. Create account: https://huggingface.co/join', 'cyan');
    log('   2. Create a new Space or use Colab', 'cyan');
    log('   3. Upload your dataset', 'cyan');
    log('   4. Use transformers library to fine-tune', 'cyan');
    log('   5. Deploy your model', 'cyan');
  } else {
    log('\n⚠️  Dataset not found. Run: npm run merge-datasets', 'yellow');
  }
  
  log('\n💡 Recommended: Use Gemini with Few-Shot Learning', 'yellow');
  log('   This is free and works immediately:', 'cyan');
  log('   npm run setup-gemini-fewshot', 'cyan');
  log('\n');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});





