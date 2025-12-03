/**
 * Test Code Error Detection
 * 
 * This script tests the code error detection functionality
 * Run with: node backend/test-code-error-detection.js
 */

import { 
  analyzeCodeForIssues, 
  generateIssueFeedback, 
  parseErrorMessage,
  generateFallbackFeedback 
} from './services/codeErrorAnalyzer.js';

// Test cases
const testCases = [
  {
    name: "Undefined variable (uppercase X)",
    code: "print(X)",
    error: null,
    expected: "Should detect undefined variable X"
  },
  {
    name: "Undefined variable (lowercase x)",
    code: "print(x)",
    error: null,
    expected: "Should detect undefined variable x"
  },
  {
    name: "With explicit NameError",
    code: "print(x)",
    error: "NameError: name 'x' is not defined",
    expected: "Should parse error and provide specific feedback"
  },
  {
    name: "Correct code with quotes",
    code: 'print("Hello World")',
    error: null,
    expected: "Should detect no errors"
  },
  {
    name: "Multiple undefined variables",
    code: "print(name)\nprint(age)",
    error: null,
    expected: "Should detect multiple undefined variables"
  },
  {
    name: "Variable defined after use",
    code: "print(x)\nx = 5",
    error: null,
    expected: "Should detect variable used before definition"
  },
  {
    name: "TypeError",
    code: 'result = "5" + 3',
    error: "TypeError: can only concatenate str (not \"int\") to str",
    expected: "Should detect type error"
  }
];

console.log("=".repeat(80));
console.log("CODE ERROR DETECTION TEST");
console.log("=".repeat(80));
console.log();

// Test 1: Pattern-based analysis
console.log("TEST 1: Pattern-Based Error Detection");
console.log("-".repeat(80));
console.log();

testCases.forEach((testCase, index) => {
  console.log(`\n[Test ${index + 1}] ${testCase.name}`);
  console.log(`Code: ${testCase.code}`);
  if (testCase.error) {
    console.log(`Error: ${testCase.error}`);
  }
  console.log(`Expected: ${testCase.expected}`);
  console.log();
  
  // Analyze code
  const { issues, suggestions } = analyzeCodeForIssues(testCase.code);
  
  console.log(`Issues detected: ${issues.length}`);
  if (issues.length > 0) {
    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. [${issue.type}] Line ${issue.line}: ${issue.message}`);
      if (issue.variable) {
        console.log(`     Variable: ${issue.variable}`);
      }
    });
  } else {
    console.log("  ✓ No issues detected");
  }
  
  if (suggestions.length > 0) {
    console.log(`\nSuggestions: ${suggestions.length}`);
    suggestions.forEach((suggestion, idx) => {
      console.log(`  ${idx + 1}. ${suggestion.message}`);
      if (suggestion.alternatives) {
        suggestion.alternatives.forEach(alt => {
          console.log(`     - ${alt}`);
        });
      }
    });
  }
  
  console.log("\n" + "-".repeat(80));
});

// Test 2: Error message parsing
console.log("\n\nTEST 2: Error Message Parsing");
console.log("-".repeat(80));
console.log();

const errorMessages = [
  "NameError: name 'x' is not defined",
  "NameError: name 'X' is not defined at line 1",
  "TypeError: can only concatenate str (not \"int\") to str",
  "SyntaxError: invalid syntax",
  "IndexError: list index out of range"
];

errorMessages.forEach((errorMsg, index) => {
  console.log(`\n[Error ${index + 1}]`);
  console.log(`Original: ${errorMsg}`);
  const parsed = parseErrorMessage(errorMsg);
  console.log(`Parsed:`);
  console.log(`  Type: ${parsed?.type || 'null'}`);
  console.log(`  Variable: ${parsed?.variable || 'null'}`);
  console.log(`  Line: ${parsed?.line || 'null'}`);
  console.log(`  Message: ${parsed?.message}`);
});

// Test 3: Fallback feedback generation
console.log("\n\nTEST 3: Fallback Feedback Generation");
console.log("-".repeat(80));
console.log();

const sampleCode = "print(x)";
const sampleError = "NameError: name 'x' is not defined";

console.log(`Code: ${sampleCode}`);
console.log(`Error: ${sampleError}`);
console.log("\nGenerated Feedback:");
console.log("-".repeat(80));
const fallback = generateFallbackFeedback(sampleCode, sampleError, []);
console.log(fallback);

// Test 4: Sample API request format
console.log("\n\nTEST 4: Sample API Request");
console.log("-".repeat(80));
console.log();

console.log("Sample POST request to /api/ai/code-feedback:");
console.log();
console.log(JSON.stringify({
  code: "print(x)",
  error: null,
  output: null,
  language: "python",
  provider: "auto"
}, null, 2));

console.log("\n\nSample POST request with error:");
console.log();
console.log(JSON.stringify({
  code: "print(x)",
  error: "NameError: name 'x' is not defined",
  output: null,
  language: "python",
  provider: "auto"
}, null, 2));

console.log("\n" + "=".repeat(80));
console.log("TEST COMPLETE");
console.log("=".repeat(80));




