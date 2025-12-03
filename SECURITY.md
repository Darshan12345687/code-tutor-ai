# Security Guide - API Key Protection

## ⚠️ CRITICAL: API Key Security

**NEVER expose API keys in:**
- ❌ Client-side code (browser/React)
- ❌ Public repositories (GitHub, GitLab, etc.)
- ❌ Logs or console output
- ❌ API responses
- ❌ Frontend environment variables
- ❌ Committed code files

## ✅ Secure Practices

### 1. Environment Variables Only

API keys are **ONLY** stored in:
- ✅ `.env` file (server-side only)
- ✅ Environment variables on server
- ✅ Secure secret management systems (AWS Secrets Manager, etc.)

### 2. Server-Side Only

All AI API calls are made **server-side only**:
- ✅ Backend makes all API requests
- ✅ Frontend never sees API keys
- ✅ API keys never sent to client

### 3. Response Sanitization

All API responses are sanitized to remove:
- API keys
- Sensitive tokens
- Internal configuration

### 4. Git Protection

The `.env` file is in `.gitignore`:
```gitignore
.env
*.env
.env.local
```

**Never commit `.env` files!**

## Current API Keys

### Configured Keys

1. **Mistral AI**
   - Key: `[YOUR_MISTRAL_API_KEY]` (Set in .env file)
   - Status: ✅ Configured via environment variables
   - Location: Server-side only

2. **Google Gemini**
   - Key: `[YOUR_GOOGLE_AI_API_KEY]` (Set in .env file)
   - Status: ✅ Configured via environment variables
   - Location: Server-side only

3. **OpenAI**
   - Key: `[YOUR_OPENAI_API_KEY]` (Set in .env file)
   - Status: ✅ Configured via environment variables
   - Location: Server-side only

## Security Features Implemented

### 1. API Key Protection Middleware

```javascript
// Automatically removes API keys from requests/responses
app.use(protectApiKeys);
```

### 2. Response Sanitization

All responses are automatically sanitized:
- Removes API key patterns
- Replaces with `[API_KEY_REDACTED]`
- Prevents accidental exposure

### 3. Environment Validation

On server startup:
- Validates API keys are set
- Warns if keys might be exposed
- Never logs actual keys

### 4. Error Handling

Error responses are sanitized:
- No stack traces in production
- No sensitive data in errors
- Safe error messages only

## If API Key is Exposed

If you accidentally expose an API key:

1. **Immediately revoke the key** in the provider's dashboard
2. **Generate a new key**
3. **Update `.env` file** with new key
4. **Check logs** for any unauthorized usage
5. **Review access** in provider dashboard

### OpenAI Key Revocation

1. Go to https://platform.openai.com/api-keys
2. Find the exposed key
3. Click "Revoke"
4. Create a new key
5. Update `.env` file

## Best Practices

### Development

```bash
# ✅ Good: Use .env file
echo "OPENAI_API_KEY=sk-..." >> .env

# ❌ Bad: Hardcode in code
const apiKey = "sk-..."; // NEVER DO THIS
```

### Production

```bash
# ✅ Good: Use environment variables
export OPENAI_API_KEY=sk-...

# ✅ Good: Use secret management
# AWS Secrets Manager, HashiCorp Vault, etc.
```

### Frontend

```javascript
// ❌ NEVER do this in frontend:
const apiKey = process.env.REACT_APP_OPENAI_KEY; // EXPOSED!

// ✅ Always call backend API:
fetch('/api/ai/explain', { ... }); // Backend handles API key
```

## Monitoring

### Check for Exposed Keys

```bash
# Search codebase for potential key exposure
grep -r "sk-proj" --exclude-dir=node_modules .
grep -r "AIzaSy" --exclude-dir=node_modules .
```

### Git History

If you accidentally committed a key:

```bash
# Remove from git history (use with caution)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

## Compliance

This application follows:
- ✅ OWASP API Security guidelines
- ✅ OpenAI API key security best practices
- ✅ Industry-standard secret management

## Support

For security concerns:
- Review provider documentation
- Check security logs
- Contact provider support if key is compromised

