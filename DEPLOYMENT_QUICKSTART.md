# Quick Start: Deploy to Netlify

## 🚀 Quick Deployment Steps

### 1. Deploy Backend First (Choose One)

**Railway (Recommended - Easiest)**
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add MongoDB service
5. Set environment variables (see below)
6. Deploy!

**Render**
1. Go to [render.com](https://render.com) and sign up
2. Create "New Web Service"
3. Connect GitHub repo
4. Build: `cd backend && npm install`
5. Start: `cd backend && npm start`
6. Add MongoDB database
7. Set environment variables

### 2. Get Your Backend URL

After backend deploys, copy the URL (e.g., `https://your-app.railway.app`)

### 3. Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/build`
5. **Add Environment Variable**:
   - Key: `REACT_APP_API_URL`
   - Value: Your backend URL (from step 2)
6. Click "Deploy site"

### 4. Update Backend CORS

In your backend hosting platform, add environment variable:
- `FRONTEND_URL` = Your Netlify URL (e.g., `https://your-app.netlify.app`)

Or update `backend/server.js` manually to include your Netlify URL in the CORS origins.

## ✅ Done!

Your app should now be live! Visit your Netlify URL to test.

## 🔧 Backend Environment Variables Needed

Set these in your backend hosting platform:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
OPENAI_API_KEY=your_key (optional)
GEMINI_API_KEY=your_key (optional)
MISTRAL_API_KEY=your_key (optional)
FRONTEND_URL=https://your-app.netlify.app
PORT=8000
NODE_ENV=production
```

## 📝 Notes

- The `netlify.toml` file is already configured
- API configuration utility is set up in `frontend/src/utils/apiConfig.ts`
- Some components may still have hardcoded URLs - see `UPDATE_REMAINING_FILES.md`
- For detailed instructions, see `NETLIFY_DEPLOYMENT.md`

## 🐛 Troubleshooting

**Frontend can't connect to backend?**
- Check `REACT_APP_API_URL` is set in Netlify
- Verify backend CORS includes your Netlify URL
- Check backend is running and accessible

**Build fails?**
- Check Netlify build logs
- Ensure all dependencies are in `package.json`
- Verify Node version (set to 18 in `netlify.toml`)

