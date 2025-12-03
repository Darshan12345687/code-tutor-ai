# AI Providers Integration Guide

## Integrated AI Providers

The Code Tutor application supports multiple AI providers with automatic fallback:

### 1. Mistral AI (Primary) ✅
- **API Key**: Set in `.env` file as `MISTRAL_API_KEY`
- **Status**: Configured via environment variables
- **Model**: `mistral-medium-latest`
- **Features**: Code explanations, course generation, feedback
- **Free Tier**: Available
- **Priority**: 1 (First to try)

### 2. Google Gemini (Secondary) ✅
- **API Key**: Set in `.env` file as `GOOGLE_AI_API_KEY`
- **Status**: Configured via environment variables
- **Model**: `gemini-pro`
- **Features**: Code explanations, course generation, feedback
- **Free Tier**: Available
- **Priority**: 2 (Second to try)

### 3. OpenAI (Optional)
- **API Key**: Set in environment variable
- **Status**: Optional
- **Model**: `gpt-4` (configurable)
- **Features**: Code explanations, course generation, feedback
- **Free Tier**: Limited
- **Priority**: 3 (Third to try)

### 4. Hugging Face (Optional)
- **API Key**: Set in environment variable
- **Status**: Optional
- **Model**: Various free models available
- **Features**: Code explanations
- **Free Tier**: Available
- **Priority**: 4 (Last to try)

## How It Works

### Automatic Fallback System

When a user requests an AI explanation, the system:

1. **Tries Mistral AI first** (if API key is configured)
2. **Falls back to Gemini** (if Mistral fails or unavailable)
3. **Falls back to OpenAI** (if Gemini fails)
4. **Falls back to Hugging Face** (if OpenAI fails)
5. **Uses basic fallback** (if all providers fail)

### Provider Selection

Users can specify a provider:
- `auto` - Automatic fallback (default)
- `mistral` - Use Mistral AI only
- `gemini` - Use Google Gemini only
- `openai` - Use OpenAI only
- `huggingface` - Use Hugging Face only

## API Usage

### Get Available Providers
```bash
GET /api/ai/providers
```

Response:
```json
{
  "providers": [
    { "name": "mistral", "available": true },
    { "name": "gemini", "available": true },
    { "name": "openai", "available": false },
    { "name": "huggingface", "available": false }
  ]
}
```

### Request Code Explanation
```bash
POST /api/ai/explain
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "print('Hello, World!')",
  "language": "python",
  "provider": "auto"  // or "mistral", "gemini", "openai", "huggingface"
}
```

Response:
```json
{
  "explanation": "This code prints 'Hello, World!' to the console...",
  "provider": "mistral",
  "concepts": ["Functions", "Print Statements"],
  "examples": ["print('Hello')"]
}
```

## Configuration

### Environment Variables

```env
# Primary AI Providers (Set your API keys)
MISTRAL_API_KEY=your-mistral-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# Optional AI Providers
OPENAI_API_KEY=your-openai-key-here
HUGGING_FACE_API_KEY=your-hugging-face-key-here
```

### Default Behavior

- If `MISTRAL_API_KEY` is set, Mistral is used first
- If `GOOGLE_AI_API_KEY` is set, Gemini is used as fallback
- The system automatically handles API failures and switches providers

## Rate Limits

Each provider has different rate limits:

- **Mistral AI**: Check Mistral documentation
- **Google Gemini**: Free tier has generous limits
- **OpenAI**: Based on your plan
- **Hugging Face**: Free tier available with rate limits

## Best Practices

1. **Use Auto Mode**: Let the system choose the best available provider
2. **Monitor Usage**: Track API usage across providers
3. **Handle Errors**: The system automatically falls back on errors
4. **Cache Responses**: Consider caching common explanations

## Adding New Providers

To add a new AI provider:

1. Create a new function in `services/aiService.js`:
   ```javascript
   export const explainCodeWithNewProvider = async (code, language) => {
     // Implementation
   };
   ```

2. Add it to the fallback chain in `explainCode()` function

3. Update `getAvailableProviders()` to include the new provider

4. Add environment variable for API key

## Troubleshooting

### Provider Not Working

1. Check API key is correctly set in environment
2. Verify API key is valid and has credits/quota
3. Check network connectivity
4. Review error logs for specific error messages

### All Providers Failing

The system will return a basic fallback explanation if all providers fail. Check:
- Network connectivity
- API key validity
- Provider service status
- Rate limit exceeded

## Support

For issues with specific providers:
- **Mistral AI**: https://docs.mistral.ai
- **Google Gemini**: https://ai.google.dev/docs
- **OpenAI**: https://platform.openai.com/docs
- **Hugging Face**: https://huggingface.co/docs/api-inference

