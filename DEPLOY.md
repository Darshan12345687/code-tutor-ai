# CodeTutor AI - Deployment Guide

Complete guide to deploy both frontend and backend of CodeTutor AI.

## Prerequisites

- GitHub repository: https://github.com/Darshan12345687/code-tutor-ai
- MongoDB database (MongoDB Atlas recommended - free tier available)
- API keys for AI services (OpenAI, Gemini, Mistral - optional)

---

## Part 1: Backend Deployment

### Option A: Railway (Recommended - Easiest)

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `code-tutor-ai` repository
   - Railway will detect it's a Node.js project

3. **Configure Service**:
   - Railway auto-detects `backend/package.json`
   - If not, set **Root Directory**: `backend`
   - Set **Start Command**: `npm start`
   - Set **Build Command**: `npm install`

4. **Add MongoDB**:
   - Click "+ New" → "Database" → "Add MongoDB"
   - Copy the connection string

5. **Set Environment Variables**:
   - Go to your service → "Variables" tab
   - Add these variables:
     ```
     MONGODB_URI=your_mongodb_connection_string_from_railway
     JWT_SECRET=your_random_secret_key_min_32_chars
     PORT=8000
     NODE_ENV=production
     FRONTEND_URL=https://your-app.netlify.app (set after frontend deploys)
     ```
   - Optional AI API keys:
     ```
     OPENAI_API_KEY=your_key (optional)
     GEMINI_API_KEY=your_key (optional)
     MISTRAL_API_KEY=your_key (optional)
     ```

6. **Deploy**:
   - Railway will automatically deploy
   - Copy your backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. **Sign up**: Go to [render.com](https://render.com) and sign in with GitHub

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your `code-tutor-ai` repository

3. **Configure Service**:
   - **Name**: `codetutor-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

4. **Add MongoDB**:
   - Click "New +" → "MongoDB"
   - Create database (free tier available)
   - Copy the connection string

5. **Set Environment Variables**:
   - Go to "Environment" tab
   - Add the same variables as Railway (see above)

6. **Deploy**:
   - Click "Create Web Service"
   - Copy your backend URL (e.g., `https://codetutor-backend.onrender.com`)

### Option C: Heroku

1. **Install Heroku CLI**: `brew install heroku/brew/heroku`

2. **Login**: `heroku login`

3. **Create App**:
   ```bash
   cd backend
   heroku create codetutor-backend
   ```

4. **Add MongoDB**:
   - Go to Heroku dashboard → Add-ons → MongoDB Atlas
   - Or use MongoDB Atlas directly (free tier)

5. **Set Environment Variables**:
   ```bash
   heroku config:set MONGODB_URI=your_connection_string
   heroku config:set JWT_SECRET=your_secret
   heroku config:set NODE_ENV=production
   heroku config:set PORT=8000
   ```

6. **Deploy**:
   ```bash
   git subtree push --prefix backend heroku main
   ```

---

## Part 2: Frontend Deployment (Netlify)

1. **Sign up**: Go to [netlify.com](https://netlify.com) and sign in with GitHub

2. **Create New Site**:
   - Click "Add new site" → "Import an existing project"
   - Click "Deploy with GitHub"
   - Authorize Netlify to access your GitHub account
   - Select `code-tutor-ai` repository

3. **Configure Build Settings**:
   - **Base directory**: (leave empty)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/build`

4. **Set Environment Variables**:
   - Go to "Site settings" → "Environment variables"
   - Click "Add variable"
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend URL from Part 1
     - Example: `https://your-app.railway.app`
     - Or: `https://codetutor-backend.onrender.com`

5. **Deploy**:
   - Click "Deploy site"
   - Wait for build to complete
   - Copy your Netlify URL (e.g., `https://your-app.netlify.app`)

---

## Part 3: Update Backend CORS

After frontend is deployed, update backend CORS to allow your Netlify URL:

### For Railway:
1. Go to your Railway service → Variables
2. Add/Update: `FRONTEND_URL=https://your-app.netlify.app`
3. Redeploy (Railway will auto-redeploy)

### For Render:
1. Go to your Render service → Environment
2. Add/Update: `FRONTEND_URL=https://your-app.netlify.app`
3. Manual Deploy → Clear build cache & deploy

### For Heroku:
```bash
heroku config:set FRONTEND_URL=https://your-app.netlify.app
```

### Or Update server.js Manually:

If environment variable doesn't work, update `backend/server.js`:

```javascript
// Find the CORS configuration (around line 61)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    'https://your-app.netlify.app',  // Add your Netlify URL
    /^https:\/\/.*\.netlify\.app$/    // Allow all Netlify previews
  ].filter(Boolean),
  credentials: true
}));
```

Then commit and push:
```bash
git add backend/server.js
git commit -m "Update CORS for Netlify deployment"
git push origin main
```

---

## Part 4: MongoDB Setup (If Not Using Railway/Render MongoDB)

1. **Sign up**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to you
   - Create cluster

3. **Create Database User**:
   - Database Access → Add New User
   - Username/Password (save these!)
   - Set permissions: "Atlas Admin"

4. **Whitelist IP**:
   - Network Access → Add IP Address
   - For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add your hosting provider's IP ranges

5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password
   - Use this as `MONGODB_URI` in your backend environment variables

---

## Quick Deployment Checklist

### Backend:
- [ ] Choose hosting (Railway/Render/Heroku)
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Add MongoDB database
- [ ] Set environment variables:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=8000`
- [ ] Deploy and copy backend URL

### Frontend:
- [ ] Sign up for Netlify
- [ ] Connect GitHub repository
- [ ] Set build command: `cd frontend && npm install && npm run build`
- [ ] Set publish directory: `frontend/build`
- [ ] Add environment variable: `REACT_APP_API_URL` = backend URL
- [ ] Deploy and copy Netlify URL

### Final Steps:
- [ ] Update backend `FRONTEND_URL` environment variable
- [ ] Test frontend → backend connection
- [ ] Verify CORS is working (check browser console)

---

## Troubleshooting

### Backend Issues:

**Build Fails**:
- Check Node.js version (should be 18+)
- Verify `backend/package.json` exists
- Check build logs for specific errors

**Database Connection Fails**:
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

**CORS Errors**:
- Verify `FRONTEND_URL` is set correctly
- Check `backend/server.js` CORS configuration
- Ensure frontend URL is in allowed origins

### Frontend Issues:

**Build Fails**:
- Check `REACT_APP_API_URL` is set
- Verify Node.js version (18+)
- Check build logs for TypeScript/compilation errors

**API Calls Fail**:
- Verify `REACT_APP_API_URL` matches your backend URL
- Check browser console for CORS errors
- Ensure backend is running and accessible

**Environment Variables Not Working**:
- Variables must start with `REACT_APP_`
- Rebuild after adding new variables
- Check Netlify build logs

---

## Environment Variables Reference

### Backend Required:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codetutor
JWT_SECRET=your_random_secret_key_min_32_characters
PORT=8000
NODE_ENV=production
FRONTEND_URL=https://your-app.netlify.app
```

### Backend Optional (AI Services):
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
```

### Frontend Required:
```
REACT_APP_API_URL=https://your-backend.railway.app
```

---

## URLs After Deployment

- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-backend.railway.app` (or Render/Heroku URL)
- **GitHub**: `https://github.com/Darshan12345687/code-tutor-ai`

---

## Support

If you encounter issues:
1. Check build logs in your hosting platform
2. Verify all environment variables are set
3. Check browser console for frontend errors
4. Check backend logs for API errors
5. Verify MongoDB connection string is correct

