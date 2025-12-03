# Fine-tuning Steps - Complete Guide

## Quick Start

```bash
cd backend

# 1. Fine-tune your model
npm run finetune

# 2. Wait for training (10-30 minutes)

# 3. Test responses
npm run test-responses

# 4. Add more examples if needed
npm run add-examples
```

## Detailed Steps

### Step 1: Install OpenAI CLI (if not installed)

```bash
pip install openai
# or
pip3 install openai
```

### Step 2: Verify API Key

Make sure your `.env` file has:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

Test it:
```bash
npm run validate-keys
```

### Step 3: Run Fine-tuning

```bash
npm run finetune
```

This will:
- ✅ Check prerequisites
- ✅ Upload your dataset
- ✅ Create fine-tuning job
- ✅ Provide monitoring commands

**Expected output:**
```
✅ Dataset uploaded! File ID: file-xxxxx
✅ Fine-tuning job created! Job ID: ft-xxxxx
```

### Step 4: Monitor Training

The script will provide commands to monitor. Or use:

```bash
# Check status
openai api fine_tunes.get -i ft-xxxxx

# Follow progress
openai api fine_tunes.follow -i ft-xxxxx
```

**Training time:** 10-30 minutes (depends on dataset size)

### Step 5: Get Fine-tuned Model Name

Once training completes, get your model name:

```bash
openai api fine_tunes.get -i ft-xxxxx
```

Look for `fine_tuned_model` field. It will look like:
```
ft:gpt-3.5-turbo:your-org:codetutor-beginner:xxxxx
```

### Step 6: Update Environment

Edit `.env` file:
```env
OPENAI_MODEL=ft:gpt-3.5-turbo:your-org:codetutor-beginner:xxxxx
```

### Step 7: Restart Server

```bash
npm start
# or
npm run dev
```

### Step 8: Test Responses

```bash
npm run test-responses
```

This will test 5 common questions and verify:
- ✅ Responses use analogies
- ✅ Language is simple
- ✅ Responses are concise
- ✅ Beginner-friendly format

## Adding More Examples

### Option 1: Interactive Script

```bash
npm run add-examples
```

This will guide you through adding examples interactively.

### Option 2: Manual Edit

1. Edit `config/dataset-beginner-friendly.jsonl`
2. Add new examples in JSONL format:
   ```jsonl
   {"input": "Your question", "output": "Simple analogy-based answer"}
   ```
3. Merge datasets:
   ```bash
   npm run merge-datasets
   ```
4. Prepare for fine-tuning:
   ```bash
   npm run prepare-dataset
   ```
5. Fine-tune again:
   ```bash
   npm run finetune
   ```

## Example Format

Good beginner-friendly examples:

```jsonl
{"input": "Explain variables in Python.", "output": "A variable is like a labeled box where you store something. In Python: x = 5 means you put 5 into box x."}
{"input": "What is a loop?", "output": "A loop is like checking each item on your grocery list one by one. Code repeats until done."}
{"input": "Explain functions to a beginner.", "output": "A function is like a vending machine: you give input, it performs work, you get output."}
```

**Key characteristics:**
- ✅ Starts with analogy
- ✅ Simple language
- ✅ Brief (1-3 sentences)
- ✅ Includes code example if relevant

## Testing Your Fine-tuned Model

### Manual Test

```bash
curl -X POST http://localhost:8000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain variables in Python",
    "language": "python",
    "mode": "beginner"
  }'
```

### Automated Test

```bash
npm run test-responses
```

Expected results:
- ✅ Keyword score: 50%+
- ✅ Response length: < 500 characters
- ✅ Uses analogies
- ✅ Simple language

## Troubleshooting

### Fine-tuning Fails

**Problem:** "Insufficient quota"
- **Solution:** Check your OpenAI account balance

**Problem:** "Invalid file format"
- **Solution:** Run `npm run prepare-dataset` first

**Problem:** "File too large"
- **Solution:** Split dataset or use smaller subset

### Responses Not Beginner-Friendly

**Problem:** Still too technical
- **Solution:** 
  1. Add more beginner examples
  2. Re-fine-tune with larger dataset
  3. Check mode is set to "beginner"

**Problem:** Responses too long
- **Solution:**
  1. Add more concise examples
  2. Emphasize brevity in examples

### Model Not Found

**Problem:** "Model not found" error
- **Solution:**
  1. Verify model name in `.env`
  2. Check training completed successfully
  3. Wait a few minutes after training completes

## Cost Estimation

### Training Cost
- **Dataset size:** 97 examples
- **Estimated tokens:** ~30,000
- **Training cost:** ~$0.24

### Usage Cost
- **Per request:** ~$0.002 per 1K tokens
- **1000 requests:** ~$2-5 (depends on response length)

### Tips to Reduce Costs
- Use gpt-3.5-turbo (cheaper than gpt-4)
- Keep responses concise
- Cache common responses
- Use rate limiting

## Next Steps After Fine-tuning

1. ✅ **Test thoroughly** - Run `npm run test-responses`
2. ✅ **Monitor usage** - Track API costs
3. ✅ **Collect feedback** - See what users think
4. ✅ **Iterate** - Add more examples based on gaps
5. ✅ **Re-fine-tune** - Improve with more data

## Quick Reference

```bash
# Full workflow
npm run merge-datasets      # Merge datasets
npm run prepare-dataset     # Prepare for fine-tuning
npm run finetune            # Start fine-tuning
npm run test-responses      # Test after training

# Adding examples
npm run add-examples        # Interactive add
# or edit config/dataset-beginner-friendly.jsonl manually

# Validation
npm run validate-keys       # Check API keys
```

## Support

For issues:
- Check OpenAI documentation: https://platform.openai.com/docs/guides/fine-tuning
- Review dataset format in `config/dataset-beginner-friendly.jsonl`
- Check server logs for errors
- Verify API keys with `npm run validate-keys`

---

**Status:** Ready to fine-tune!
**Dataset:** 97 examples
**Next:** Run `npm run finetune`





