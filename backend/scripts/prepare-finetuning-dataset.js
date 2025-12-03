#!/usr/bin/env node

/**
 * Fine-tuning Dataset Preparation Script
 * Converts dataset template to format ready for AI provider fine-tuning
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

function validateJSONL(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  let valid = 0;
  let invalid = 0;
  
  lines.forEach((line, index) => {
    try {
      const obj = JSON.parse(line);
      if (obj.input && obj.output) {
        valid++;
      } else {
        log(`⚠️  Line ${index + 1}: Missing 'input' or 'output' field`, 'yellow');
        invalid++;
      }
    } catch (error) {
      log(`❌ Line ${index + 1}: Invalid JSON - ${error.message}`, 'red');
      invalid++;
    }
  });
  
  return { valid, invalid, total: lines.length };
}

function convertToOpenAIFormat(jsonlPath, outputPath) {
  log('\n🔄 Converting to OpenAI fine-tuning format...\n', 'blue');
  
  const content = readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n');
  const openaiFormat = [];
  
  lines.forEach((line, index) => {
    try {
      const { input, output } = JSON.parse(line);
      
      openaiFormat.push({
        messages: [
          {
            role: 'system',
            content: 'You are CodeTutorAI, a programming instructor. Explain concepts using analogies, examples, and step-by-step breakdowns.'
          },
          {
            role: 'user',
            content: input
          },
          {
            role: 'assistant',
            content: output
          }
        ]
      });
      
      log(`✅ Converted example ${index + 1}`, 'green');
    } catch (error) {
      log(`❌ Error converting line ${index + 1}: ${error.message}`, 'red');
    }
  });
  
  // Write as JSONL
  const jsonlContent = openaiFormat.map(obj => JSON.stringify(obj)).join('\n');
  writeFileSync(outputPath, jsonlContent);
  
  log(`\n✅ Converted ${openaiFormat.length} examples to OpenAI format`, 'green');
  log(`📄 Saved to: ${outputPath}\n`, 'cyan');
  
  return openaiFormat.length;
}

function convertToMistralFormat(jsonlPath, outputPath) {
  log('\n🔄 Converting to Mistral fine-tuning format...\n', 'blue');
  
  const content = readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n');
  const mistralFormat = [];
  
  lines.forEach((line, index) => {
    try {
      const { input, output } = JSON.parse(line);
      
      mistralFormat.push({
        messages: [
          {
            role: 'system',
            content: 'You are CodeTutorAI, a programming instructor. Explain concepts using analogies, examples, and step-by-step breakdowns.'
          },
          {
            role: 'user',
            content: input
          },
          {
            role: 'assistant',
            content: output
          }
        ]
      });
      
      log(`✅ Converted example ${index + 1}`, 'green');
    } catch (error) {
      log(`❌ Error converting line ${index + 1}: ${error.message}`, 'red');
    }
  });
  
  // Write as JSONL
  const jsonlContent = mistralFormat.map(obj => JSON.stringify(obj)).join('\n');
  writeFileSync(outputPath, jsonlContent);
  
  log(`\n✅ Converted ${mistralFormat.length} examples to Mistral format`, 'green');
  log(`📄 Saved to: ${outputPath}\n`, 'cyan');
  
  return mistralFormat.length;
}

function generateStatistics(jsonlPath) {
  log('\n📊 Dataset Statistics\n', 'blue');
  log('='.repeat(50), 'cyan');
  
  const content = readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n');
  
  let totalInputChars = 0;
  let totalOutputChars = 0;
  let totalInputWords = 0;
  let totalOutputWords = 0;
  
  lines.forEach((line) => {
    try {
      const { input, output } = JSON.parse(line);
      totalInputChars += input.length;
      totalOutputChars += output.length;
      totalInputWords += input.split(/\s+/).length;
      totalOutputWords += output.split(/\s+/).length;
    } catch (error) {
      // Skip invalid lines
    }
  });
  
  log(`Total Examples: ${lines.length}`, 'cyan');
  log(`Average Input Length: ${Math.round(totalInputChars / lines.length)} characters`, 'cyan');
  log(`Average Output Length: ${Math.round(totalOutputChars / lines.length)} characters`, 'cyan');
  log(`Average Input Words: ${Math.round(totalInputWords / lines.length)}`, 'cyan');
  log(`Average Output Words: ${Math.round(totalOutputWords / lines.length)}`, 'cyan');
  log('='.repeat(50) + '\n', 'cyan');
}

async function main() {
  log('\n🚀 CodeTutor Fine-tuning Dataset Preparation\n', 'blue');
  log('='.repeat(60), 'cyan');
  
  // Try merged dataset first, fallback to template
  const datasetsDir = join(__dirname, '..', 'datasets');
  const mergedPath = join(datasetsDir, 'merged-dataset.jsonl');
  const templatePath = join(__dirname, '..', 'config', 'dataset-template.jsonl');
  
  let datasetPath = mergedPath;
  if (!existsSync(mergedPath)) {
    log('💡 Merged dataset not found, using template. Run "npm run merge-datasets" first for best results.\n', 'yellow');
    datasetPath = templatePath;
  }
  
  const outputDir = join(__dirname, '..', 'datasets');
  
  // Check if dataset exists
  if (!existsSync(datasetPath)) {
    log(`❌ Dataset not found: ${datasetPath}`, 'red');
    log('💡 Create a dataset file first using the template in config/dataset-template.jsonl', 'yellow');
    process.exit(1);
  }
  
  // Create output directory
  if (!existsSync(outputDir)) {
    const fs = await import('fs');
    fs.mkdirSync(outputDir, { recursive: true });
    log(`📁 Created output directory: ${outputDir}`, 'green');
  }
  
  // Validate dataset
  log('\n🔍 Validating dataset...\n', 'blue');
  const validation = validateJSONL(datasetPath);
  
  log(`✅ Valid examples: ${validation.valid}`, 'green');
  if (validation.invalid > 0) {
    log(`⚠️  Invalid examples: ${validation.invalid}`, 'yellow');
  }
  
  if (validation.valid === 0) {
    log('❌ No valid examples found!', 'red');
    process.exit(1);
  }
  
  // Generate statistics
  generateStatistics(datasetPath);
  
  // Convert to different formats
  const openaiPath = join(outputDir, 'openai-finetuning.jsonl');
  const mistralPath = join(outputDir, 'mistral-finetuning.jsonl');
  
  convertToOpenAIFormat(datasetPath, openaiPath);
  convertToMistralFormat(datasetPath, mistralPath);
  
  log('✅ Dataset preparation complete!\n', 'green');
  log('📋 Next Steps:\n', 'blue');
  log('1. Review the converted files in the datasets/ directory', 'cyan');
  log('2. Add more examples to your dataset if needed', 'cyan');
  log('3. Use the provider-specific format files for fine-tuning:', 'cyan');
  log('   - OpenAI: datasets/openai-finetuning.jsonl', 'cyan');
  log('   - Mistral: datasets/mistral-finetuning.jsonl', 'cyan');
  log('4. Follow provider documentation for fine-tuning:', 'cyan');
  log('   - OpenAI: https://platform.openai.com/docs/guides/fine-tuning', 'cyan');
  log('   - Mistral: https://docs.mistral.ai/fine-tuning/\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});

