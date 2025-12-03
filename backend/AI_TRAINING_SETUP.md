# AI Model Training & API Key Configuration Guide

This guide will help you configure API keys for training AI models to provide proper output and feedback to CodeTutor users.

## Overview

CodeTutor uses multiple AI providers with automatic fallback to ensure reliable service:
- **Primary**: Mistral AI (recommended)
- **Secondary**: Google Gemini (recommended)
- **Optional**: OpenAI, Hugging Face

All providers are trained with the CodeTutor-AI system prompt to ensure consistent, programming-focused responses.

## Quick Setup

### Step 1: Create Environment File

```bash
cd backend
cp .env.example .env
```

### Step 2: Configure API Keys

Open `.env` and add your API keys:

```env
# Required (at least one)
MISTRAL_API_KEY=your-actual-mistral-key
GOOGLE_AI_API_KEY=your-actual-gemini-key

# Optional
OPENAI_API_KEY=your-actual-openai-key
HUGGING_FACE_API_KEY=your-actual-huggingface-key
```

### Step 3: Verify Configuration

Run the validation script:

```bash
node scripts/validate-api-keys.js
```

## Getting API Keys

### Mistral AI (Primary - Recommended)

1. Visit: https://console.mistral.ai/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env` as `MISTRAL_API_KEY`

**Free Tier**: Available with generous limits

### Google Gemini (Secondary - Recommended)

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create a new API key
4. Copy and paste into `.env` as `GOOGLE_AI_API_KEY`

**Free Tier**: Available with generous limits

### OpenAI (Optional)

1. Visit: https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new secret key
4. Copy and paste into `.env` as `OPENAI_API_KEY`
5. Optionally set `OPENAI_MODEL=gpt-4` or `gpt-3.5-turbo`

**Note**: Requires paid account (no free tier for API access)

### Hugging Face (Optional)

1. Visit: https://huggingface.co/settings/tokens
2. Sign up or log in
3. Create a new access token
4. Copy and paste into `.env` as `HUGGING_FACE_API_KEY`

**Free Tier**: Available with rate limits

## Training Configuration

### System Prompt

All AI providers are automatically trained with the CodeTutor-AI system prompt located in:
- `backend/config/codetutorPrompt.js`

This prompt ensures:
- ✅ Programming-only focus
- ✅ Beginner-friendly explanations
- ✅ Consistent teaching style
- ✅ Automatic refusal of non-programming topics

### Customizing Training

To modify the AI behavior:

1. Edit `backend/config/codetutorPrompt.js`
2. Update the `CODETUTOR_SYSTEM_PROMPT` constant
3. Restart the server
4. All providers will use the new prompt automatically

### Testing Training

Test that your API keys are working:

```bash
# Test Mistral AI
curl -X POST http://localhost:8000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "language": "python", "provider": "mistral"}'

# Test Gemini
curl -X POST http://localhost:8000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "language": "python", "provider": "gemini"}'

# Check available providers
curl http://localhost:8000/api/ai/providers
```

## Provider Priority & Fallback

The system uses intelligent fallback:

1. **Mistral AI** (if configured) - Tried first
2. **Google Gemini** (if configured) - Tried second
3. **OpenAI** (if configured) - Tried third
4. **Hugging Face** (always available) - Tried last
5. **Basic Fallback** - If all providers fail

### Health Checking

The system automatically:
- Tracks provider health
- Skips known-unhealthy providers
- Retries with exponential backoff
- Logs errors for debugging

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use environment variables** - Never hardcode API keys
3. **Rotate keys regularly** - Update keys periodically
4. **Monitor usage** - Check API usage dashboards
5. **Use least privilege** - Only grant necessary permissions

## Troubleshooting

### API Key Not Working

1. **Verify key is correct**: Check for typos or extra spaces
2. **Check key validity**: Ensure key hasn't expired
3. **Verify quota**: Check if you've exceeded rate limits
4. **Check logs**: Review server logs for specific errors

### All Providers Failing

1. Check network connectivity
2. Verify all API keys are set correctly
3. Check provider status pages:
   - Mistral: https://status.mistral.ai/
   - Google: https://status.cloud.google.com/
   - OpenAI: https://status.openai.com/

### Provider-Specific Issues

#### Mistral AI
- Ensure you're using `mistral-medium-latest` model
- Check API key has proper permissions
- Verify account has credits/quota

#### Google Gemini
- Ensure API key is enabled for Gemini API
- Check Google Cloud Console for quotas
- Verify billing is set up (even for free tier)

#### OpenAI
- Verify account has credits
- Check model availability (gpt-4 vs gpt-3.5-turbo)
- Ensure API key has proper permissions

#### Hugging Face
- Some models require loading time
- Free tier has rate limits
- Check model availability

## Monitoring & Analytics

### Check Provider Status

```bash
GET /api/ai/providers
```

Response:
```json
{
  "providers": [
    { "name": "mistral", "available": true, "healthy": true },
    { "name": "gemini", "available": true, "healthy": true }
  ],
  "summary": {
    "total": 2,
    "healthy": 2,
    "fallbackAvailable": true
  }
}
```

### Reset Provider Health

If a provider is marked unhealthy but should work:

```bash
POST /api/ai/reset-health
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "provider": "mistral"  // or null to reset all
}
```

## Cost Management

### Free Tier Limits

- **Mistral AI**: Check current limits at console.mistral.ai
- **Google Gemini**: Generous free tier available
- **OpenAI**: Paid only (no free tier)
- **Hugging Face**: Free tier with rate limits

### Optimizing Costs

1. Use free tier providers first (Mistral, Gemini)
2. Set up usage alerts in provider dashboards
3. Monitor usage via `/api/ai/providers` endpoint
4. Use rate limiting (already configured)

## Next Steps

After configuring API keys:

1. ✅ Test each provider individually
2. ✅ Verify fallback system works
3. ✅ Test with real user queries
4. ✅ Monitor provider health
5. ✅ Set up usage alerts

## Support

For issues:
- Check provider status pages
- Review server logs
- Test with curl commands above
- Verify API keys in provider dashboards

## Additional Resources

- [AI Providers Guide](./AI_PROVIDERS.md)
- [Training Configuration](./CODETUTOR_TRAINING.md)
- [Fallback System](./FALLBACK_SYSTEM.md)





