# Quick Start: AI Training Setup

## 🚀 Fast Setup (5 minutes)

### Option 1: Interactive Setup (Recommended)

```bash
cd backend
npm run setup-keys
```

This will guide you through configuring all API keys interactively.

### Option 2: Manual Setup

1. **Copy environment template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` file and add your API keys:**
   ```env
   MISTRAL_API_KEY=your-actual-key-here
   GOOGLE_AI_API_KEY=your-actual-key-here
   ```

3. **Validate your keys:**
   ```bash
   npm run validate-keys
   ```

## 📋 Required API Keys

**At least ONE of these is required:**

- ✅ **Mistral AI** (Recommended) - [Get Key](https://console.mistral.ai/)
- ✅ **Google Gemini** (Recommended) - [Get Key](https://makersuite.google.com/app/apikey)

**Optional (for enhanced features):**

- OpenAI - [Get Key](https://platform.openai.com/api-keys)
- Hugging Face - [Get Key](https://huggingface.co/settings/tokens)

## ✅ Verify Setup

```bash
# Validate API keys
npm run validate-keys

# Start server
npm start

# Test in another terminal
curl http://localhost:8000/api/ai/providers
```

## 📚 Full Documentation

- [Complete Setup Guide](./AI_TRAINING_SETUP.md)
- [AI Providers Guide](./AI_PROVIDERS.md)
- [Training Configuration](./CODETUTOR_TRAINING.md)

## 🆘 Troubleshooting

**No providers working?**
- Check API keys are correct (no extra spaces)
- Verify keys haven't expired
- Check provider status pages
- Run `npm run validate-keys` for detailed diagnostics

**Need help?**
- See [AI_TRAINING_SETUP.md](./AI_TRAINING_SETUP.md) for detailed troubleshooting
- Check server logs for specific error messages





