# Netlify Environment Variables

## How to Set Environment Variables in Netlify

Netlify doesn't use `.env` files. You set environment variables through the Netlify dashboard.

### Steps:

1. Go to your Netlify site dashboard
2. Click **"Site settings"** (gear icon)
3. Go to **"Environment variables"** (in Build & deploy section)
4. Click **"Add variable"**
5. Enter the key and value
6. Click **"Save"**
7. **Redeploy** your site for changes to take effect

---

## Required Environment Variable

### For Frontend:

```bash
REACT_APP_API_URL=https://your-backend.railway.app
```

**Important Notes:**
- Replace `https://your-backend.railway.app` with your actual backend URL
- Variable name **MUST** start with `REACT_APP_` to be available in React
- After adding/changing, you need to **rebuild** the site

---

## Example Values

### If Backend is on Railway:
```
REACT_APP_API_URL=https://codetutor-backend-production.up.railway.app
```

### If Backend is on Render:
```
REACT_APP_API_URL=https://codetutor-backend.onrender.com
```

### If Backend is on Heroku:
```
REACT_APP_API_URL=https://codetutor-backend.herokuapp.com
```

---

## Setting via Netlify Dashboard

1. **Site settings** → **Environment variables**
2. Click **"Add variable"**
3. **Key**: `REACT_APP_API_URL`
4. **Value**: Your backend URL (e.g., `https://your-backend.railway.app`)
5. **Scopes**: 
   - ✅ Production
   - ✅ Deploy previews (optional, for testing)
   - ✅ Branch deploys (optional)
6. Click **"Save"**

---

## After Setting Variables

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for build to complete
4. Test your site - API calls should now work

---

## Verify Variables Are Set

1. Go to **"Deploys"** tab
2. Click on the latest deploy
3. Click **"Deploy log"**
4. Look for: `REACT_APP_API_URL` in the build output
5. Or check browser console - API calls should use the correct URL

---

## Troubleshooting

### Variables Not Working?

1. **Check naming**: Must start with `REACT_APP_`
2. **Rebuild required**: Changes only apply after rebuild
3. **Check scope**: Make sure variable is set for "Production"
4. **Check build logs**: Verify variable is being used

### API Calls Still Using localhost?

1. Clear browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Verify `REACT_APP_API_URL` is set correctly
4. Check browser console for actual API URL being used

---

## Quick Reference

**Variable Name**: `REACT_APP_API_URL`  
**Value**: Your backend deployment URL  
**Where to Set**: Netlify Dashboard → Site Settings → Environment Variables  
**After Setting**: Trigger new deploy

---

## Local Development

For local development, create `frontend/.env.local`:

```bash
REACT_APP_API_URL=http://localhost:8000
```

This file is already in `.gitignore` and won't be committed.

