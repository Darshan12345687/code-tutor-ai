# Fine-tuning Guide for CodeTutor AI Models

This guide explains how to fine-tune AI models using your dataset to train CodeTutorAI with the comprehensive prompt system.

## Overview

Fine-tuning allows you to train AI models on your specific dataset, making them better at following the CodeTutor teaching structure and style.

## Prerequisites

1. ✅ API keys configured (Mistral, OpenAI, or both)
2. ✅ Dataset prepared in JSONL format
3. ✅ Understanding of fine-tuning costs (varies by provider)

## Step 1: Prepare Your Dataset

### Dataset Format

Your dataset should be in JSONL format (one JSON object per line):

```jsonl
{"input": "Explain variables in Python.", "output": "1️⃣ ANALOGY\n\nVariables are like labeled boxes..."}
{"input": "What is a loop?", "output": "1️⃣ ANALOGY\n\nA loop is like checking your phone..."}
```

### Using the Template

1. **Start with the template:**
   ```bash
   cd backend
   cat config/dataset-template.jsonl
   ```

2. **Add your examples:**
   - Edit `config/dataset-template.jsonl`
   - Add more examples following the 7-step structure:
     - Analogy
     - Simple explanation
     - Beginner code example
     - Advanced example
     - Visual explanation
     - Common mistakes
     - Mini practice task

3. **Validate your dataset:**
   ```bash
   npm run prepare-dataset
   ```

This will:
- Validate your JSONL format
- Convert to provider-specific formats
- Generate statistics
- Create files in `datasets/` directory

## Step 2: Provider-Specific Fine-tuning

### OpenAI Fine-tuning

1. **Install OpenAI CLI:**
   ```bash
   pip install openai
   ```

2. **Upload your dataset:**
   ```bash
   openai api fine_tunes.create \
     -t datasets/openai-finetuning.jsonl \
     -m gpt-3.5-turbo \
     --suffix "codetutor"
   ```

3. **Monitor training:**
   ```bash
   openai api fine_tunes.follow -i <fine_tune_id>
   ```

4. **Use your fine-tuned model:**
   Update `.env`:
   ```env
   OPENAI_MODEL=ft:gpt-3.5-turbo:your-org:codetutor:xxxxx
   ```

**Cost:** ~$0.008 per 1K tokens for training, ~$0.002 per 1K tokens for usage

### Mistral AI Fine-tuning

1. **Check Mistral fine-tuning availability:**
   - Visit: https://docs.mistral.ai/fine-tuning/
   - Fine-tuning may require enterprise access

2. **Upload dataset:**
   ```bash
   curl -X POST https://api.mistral.ai/v1/fine_tuning/jobs \
     -H "Authorization: Bearer $MISTRAL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "mistral-medium-latest",
       "training_file": "datasets/mistral-finetuning.jsonl"
     }'
   ```

3. **Monitor job:**
   ```bash
   curl https://api.mistral.ai/v1/fine_tuning/jobs/<job_id> \
     -H "Authorization: Bearer $MISTRAL_API_KEY"
   ```

**Note:** Mistral fine-tuning availability may vary. Check their documentation.

### Google Gemini Fine-tuning

Currently, Google Gemini doesn't support fine-tuning through their API. However, you can:
- Use the system prompt (already implemented)
- Use few-shot examples in prompts
- Wait for fine-tuning support (coming soon)

## Step 3: Dataset Best Practices

### Quality Guidelines

1. **Consistent Structure:**
   - Always follow the 7-step format
   - Use emoji markers (1️⃣, 2️⃣, etc.)
   - Include code examples in all responses

2. **Diversity:**
   - Cover different programming languages
   - Include beginner, intermediate, and advanced topics
   - Mix conceptual questions and code debugging

3. **Size:**
   - Minimum: 50-100 examples
   - Recommended: 200-500 examples
   - Optimal: 1000+ examples

4. **Examples Should Include:**
   - Variables, loops, functions (basics)
   - OOP concepts (classes, inheritance)
   - Data structures (arrays, lists, trees)
   - Algorithms (sorting, searching)
   - Debugging scenarios
   - Framework-specific (Unity, React, etc.)

### Example Dataset Structure

```jsonl
{"input": "Explain variables", "output": "..."}
{"input": "What is a loop?", "output": "..."}
{"input": "Fix this code: print('Hello' + 5)", "output": "..."}
{"input": "Explain classes to a beginner", "output": "..."}
{"input": "Why doesn't Update run in Unity?", "output": "..."}
{"input": "What is a database index?", "output": "..."}
{"input": "Explain API simply", "output": "..."}
{"input": "Optimize this O(n^2) search", "output": "..."}
```

## Step 4: Testing Your Fine-tuned Model

1. **Update environment:**
   ```env
   OPENAI_MODEL=ft:gpt-3.5-turbo:your-org:codetutor:xxxxx
   ```

2. **Test with API:**
   ```bash
   curl -X POST http://localhost:8000/api/ai/explain \
     -H "Content-Type: application/json" \
     -d '{
       "question": "What is a variable?",
       "language": "python",
       "provider": "openai"
     }'
   ```

3. **Verify response structure:**
   - Check for 7-step format
   - Verify analogies are included
   - Ensure code examples are present
   - Confirm practice tasks are provided

## Step 5: Iterative Improvement

1. **Collect feedback:**
   - Monitor user interactions
   - Note where responses don't follow structure
   - Identify missing topics

2. **Expand dataset:**
   - Add examples for weak areas
   - Include user-requested topics
   - Add edge cases

3. **Re-fine-tune:**
   - Update dataset with new examples
   - Run fine-tuning again
   - Test improvements

## Cost Estimation

### OpenAI Fine-tuning

- **Training:** ~$0.008 per 1K tokens
- **Usage:** ~$0.002 per 1K tokens (gpt-3.5-turbo fine-tuned)
- **Example:** 1000 examples × 500 tokens avg = 500K tokens = ~$4 training cost

### Mistral Fine-tuning

- Check current pricing: https://docs.mistral.ai/pricing/
- Enterprise plans may be required

## Troubleshooting

### Dataset Issues

**Problem:** Invalid JSONL format
```bash
# Validate your dataset
npm run prepare-dataset
```

**Problem:** Missing required fields
- Ensure each line has `input` and `output`
- Check JSON syntax

### Fine-tuning Issues

**Problem:** Training fails
- Check dataset size (minimum requirements vary)
- Verify API key has fine-tuning permissions
- Review provider error messages

**Problem:** Model doesn't follow structure
- Add more examples with strict structure
- Increase dataset size
- Check prompt consistency

## Advanced: Multi-Mode Training

To train models that automatically detect mode (strict/beginner/engineer):

1. **Tag examples in dataset:**
   ```jsonl
   {"input": "Explain variables [BEGINNER MODE]", "output": "..."}
   {"input": "Optimize this code [ENGINEER MODE]", "output": "..."}
   ```

2. **Update prompt detection:**
   - Already implemented in `config/codetutorPrompt.js`
   - `detectMode()` function automatically detects mode

## Resources

- **OpenAI Fine-tuning:** https://platform.openai.com/docs/guides/fine-tuning
- **Mistral Documentation:** https://docs.mistral.ai/
- **Dataset Template:** `backend/config/dataset-template.jsonl`
- **Preparation Script:** `backend/scripts/prepare-finetuning-dataset.js`

## Next Steps

1. ✅ Prepare your dataset using the template
2. ✅ Run `npm run prepare-dataset` to validate
3. ✅ Choose a provider (OpenAI recommended for fine-tuning)
4. ✅ Upload and train your model
5. ✅ Test with real queries
6. ✅ Iterate and improve

## Support

For issues:
- Check provider documentation
- Review dataset format
- Validate API keys
- Test with small dataset first





