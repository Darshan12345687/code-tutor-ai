#!/usr/bin/env node

/**
 * Merge Multiple Dataset Files
 * Combines the detailed dataset with beginner-friendly dataset
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function readJSONL(filePath) {
  if (!existsSync(filePath)) {
    log(`⚠️  File not found: ${filePath}`, 'yellow');
    return [];
  }
  
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  const examples = [];
  
  lines.forEach((line, index) => {
    try {
      const obj = JSON.parse(line);
      if (obj.input && obj.output) {
        examples.push(obj);
      } else {
        log(`⚠️  Line ${index + 1} in ${filePath}: Missing input or output`, 'yellow');
      }
    } catch (error) {
      log(`❌ Line ${index + 1} in ${filePath}: Invalid JSON - ${error.message}`, 'red');
    }
  });
  
  return examples;
}

function mergeDatasets(files, outputPath) {
  log('\n🔄 Merging datasets...\n', 'blue');
  
  const allExamples = [];
  const seen = new Set(); // Track duplicates by input
  
  files.forEach(filePath => {
    log(`📖 Reading: ${filePath}`, 'cyan');
    const examples = readJSONL(filePath);
    log(`   Found ${examples.length} examples`, 'green');
    
    examples.forEach(example => {
      // Use input as key to avoid duplicates
      const key = example.input.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allExamples.push(example);
      } else {
        log(`   ⚠️  Skipping duplicate: ${example.input.substring(0, 50)}...`, 'yellow');
      }
    });
  });
  
  // Write merged dataset
  const jsonlContent = allExamples.map(obj => JSON.stringify(obj)).join('\n');
  writeFileSync(outputPath, jsonlContent);
  
  log(`\n✅ Merged ${allExamples.length} unique examples`, 'green');
  log(`📄 Saved to: ${outputPath}\n`, 'cyan');
  
  return allExamples.length;
}

async function main() {
  log('\n🔀 CodeTutor Dataset Merger\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  const configDir = join(__dirname, '..', 'config');
  const datasetsDir = join(__dirname, '..', 'datasets');
  
  // Ensure datasets directory exists
  if (!existsSync(datasetsDir)) {
    const fs = await import('fs');
    fs.mkdirSync(datasetsDir, { recursive: true });
  }
  
  // Define dataset files to merge
  const datasetFiles = [
    join(configDir, 'dataset-template.jsonl'),
    join(configDir, 'dataset-beginner-friendly.jsonl')
  ];
  
  // Check which files exist
  const existingFiles = datasetFiles.filter(file => existsSync(file));
  
  if (existingFiles.length === 0) {
    log('❌ No dataset files found!', 'red');
    log('💡 Create dataset files in config/ directory', 'yellow');
    process.exit(1);
  }
  
  log(`\n📋 Files to merge: ${existingFiles.length}`, 'blue');
  existingFiles.forEach(file => log(`   - ${file}`, 'cyan'));
  
  // Merge datasets
  const outputPath = join(datasetsDir, 'merged-dataset.jsonl');
  const totalExamples = mergeDatasets(existingFiles, outputPath);
  
  // Generate statistics
  log('\n📊 Statistics\n', 'blue');
  log('='.repeat(50), 'cyan');
  
  const mergedContent = readFileSync(outputPath, 'utf-8');
  const examples = mergedContent.trim().split('\n');
  
  let totalInputChars = 0;
  let totalOutputChars = 0;
  let beginnerCount = 0;
  let detailedCount = 0;
  
  examples.forEach(line => {
    try {
      const { input, output } = JSON.parse(line);
      totalInputChars += input.length;
      totalOutputChars += output.length;
      
      // Classify by output length (beginner-friendly are shorter)
      if (output.length < 300) {
        beginnerCount++;
      } else {
        detailedCount++;
      }
    } catch (error) {
      // Skip invalid lines
    }
  });
  
  log(`Total Examples: ${examples.length}`, 'cyan');
  log(`Beginner-friendly (short): ${beginnerCount}`, 'green');
  log(`Detailed (long): ${detailedCount}`, 'blue');
  log(`Average Input Length: ${Math.round(totalInputChars / examples.length)} characters`, 'cyan');
  log(`Average Output Length: ${Math.round(totalOutputChars / examples.length)} characters`, 'cyan');
  log('='.repeat(50) + '\n', 'cyan');
  
  log('✅ Dataset merge complete!\n', 'green');
  log('📋 Next Steps:\n', 'blue');
  log('1. Review merged dataset:', 'cyan');
  log(`   ${outputPath}`, 'cyan');
  log('2. Prepare for fine-tuning:', 'cyan');
  log('   npm run prepare-dataset', 'cyan');
  log('3. The merged dataset will be used for training\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});





