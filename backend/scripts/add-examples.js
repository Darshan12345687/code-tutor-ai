#!/usr/bin/env node

/**
 * Add Examples to Dataset
 * Interactive script to add new examples to the beginner-friendly dataset
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

function readJSONL(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }
  const content = readFileSync(filePath, 'utf-8');
  return content.trim().split('\n').filter(line => line.trim());
}

function writeJSONL(filePath, examples) {
  const content = examples.map(obj => JSON.stringify(obj)).join('\n');
  writeFileSync(filePath, content);
}

async function addExample() {
  log('\n📝 Add New Example\n', 'blue');
  log('='.repeat(50), 'cyan');
  
  const input = await question('Question/Input: ');
  if (!input.trim()) {
    log('❌ Input cannot be empty', 'red');
    return false;
  }
  
  log('\n💡 Tips for a good answer:', 'yellow');
  log('   - Start with an analogy (e.g., "A variable is like a box...")', 'cyan');
  log('   - Keep it concise (1-3 sentences)', 'cyan');
  log('   - Use simple language', 'cyan');
  log('   - Include a brief code example if relevant', 'cyan');
  log('\n');
  
  const output = await question('Answer/Output: ');
  if (!output.trim()) {
    log('❌ Output cannot be empty', 'red');
    return false;
  }
  
  return { input: input.trim(), output: output.trim() };
}

async function main() {
  log('\n➕ Add Examples to Beginner-Friendly Dataset\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  const datasetPath = join(__dirname, '..', 'config', 'dataset-beginner-friendly.jsonl');
  
  // Read existing examples
  const existingLines = readJSONL(datasetPath);
  const existingExamples = existingLines.map(line => JSON.parse(line));
  
  log(`\n📊 Current dataset: ${existingExamples.length} examples`, 'cyan');
  
  const newExamples = [];
  let continueAdding = true;
  
  while (continueAdding) {
    const example = await addExample();
    if (example) {
      newExamples.push(example);
      log(`\n✅ Example added! (${newExamples.length} new)`, 'green');
    }
    
    const more = await question('\nAdd another example? (y/n): ');
    continueAdding = more.toLowerCase().startsWith('y');
  }
  
  if (newExamples.length === 0) {
    log('\n⚠️  No examples added', 'yellow');
    rl.close();
    return;
  }
  
  // Check for duplicates
  const allInputs = new Set(existingExamples.map(e => e.input.toLowerCase()));
  const uniqueNew = newExamples.filter(e => !allInputs.has(e.input.toLowerCase()));
  
  if (uniqueNew.length < newExamples.length) {
    log(`\n⚠️  ${newExamples.length - uniqueNew.length} duplicate(s) removed`, 'yellow');
  }
  
  // Combine and save
  const allExamples = [...existingExamples, ...uniqueNew];
  writeJSONL(datasetPath, allExamples);
  
  log(`\n✅ Saved ${uniqueNew.length} new example(s)!`, 'green');
  log(`📊 Total examples: ${allExamples.length}`, 'cyan');
  
  log('\n📋 Next Steps:\n', 'blue');
  log('1. Merge datasets:', 'cyan');
  log('   npm run merge-datasets', 'cyan');
  log('2. Prepare for fine-tuning:', 'cyan');
  log('   npm run prepare-dataset', 'cyan');
  log('3. Fine-tune your model:', 'cyan');
  log('   npm run finetune', 'cyan');
  log('\n');
  
  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});





