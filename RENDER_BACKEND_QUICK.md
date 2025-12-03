# Quick Guide: Deploy Backend to Render

## Step-by-Step Backend Deployment

### Step 1: Sign Up / Sign In to Render
1. Go to [render.com](https://render.com)
2. Sign up or sign in with GitHub
3. Authorize Render to access your GitHub account

### Step 2: Create Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect repository:
   - Click **"Connect account"** if not connected
   - Select **"code-tutor-ai"** repository
   - Click **"Connect"**

### Step 3: Configure Backend Service

Fill in these settings:

- **Name**: `codetutor-backend` (or your preferred name)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ **IMPORTANT**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: 
  - **Free**: 512 MB RAM (good for testing)
  - **Starter**: $7/month (recommended for production - always on)

### Step 4: Add MongoDB Database

**Option A: Use Render MongoDB (Easiest)**
1. Click **"New +"** → **"MongoDB"**
2. Configure:
   - **Name**: `codetutor-db`
   - **Database**: `codetutor` (or leave default)
   - **Plan**: **Free** (512 MB) or **Starter** ($15/month)
   - **Region**: Same as your backend service
3. Click **"Create Database"**
4. Wait for database to be created (2-3 minutes)
5. Go to your MongoDB service → **"Info"** tab
6. Copy the **Internal Database URL** (starts with `mongodb://`)
   - Example: `mongodb://d0-db-user-0:password@d0-shard-00-00.xxxxx.mongodb.net:27017,d0-shard-00-01.xxxxx.mongodb.net:27017,d0-shard-00-02.xxxxx.mongodb.net:27017/codetutor?replicaSet=atlas-xxxxx-shard-0&ssl=true&authSource=admin`

**Option B: Use MongoDB Atlas (Alternative)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Get connection string and replace `<password>`

### Step 5: Set Environment Variables

Go to your backend service → **"Environment"** tab → Click **"Add Environment Variable"** for each:

```bash
# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb://your-internal-database-url-here
# Use the Internal Database URL from Render MongoDB (Option A)
# OR MongoDB Atlas connection string (Option B)

# JWT Secret (REQUIRED)
JWT_SECRET=672a3a3641e3cb7e67e2f0d72081989e99e44ba0fb315c7c9ae85d319c99caa5

# Node Environment (REQUIRED)
NODE_ENV=production

# Server Port (REQUIRED for Render)
PORT=10000
# Note: Render sets this automatically, but include it

# Frontend URL (Set after frontend deploys)
FRONTEND_URL=https://your-frontend-url.onrender.com
# Leave this for now, update after frontend is deployed
```

**Important Notes:**
- For Render MongoDB: Use the **Internal Database URL** (not external)
- PORT: Render uses 10000 by default, but include it in env vars
- JWT_SECRET: Use the provided one or generate your own

### Step 6: Deploy Backend

1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (5-10 minutes)
4. Watch the build logs for any errors
5. Once deployed, copy your backend URL:
   - Example: `https://codetutor-backend.onrender.com`

### Step 7: Test Backend

1. Visit your backend URL in browser:
   - `https://codetutor-backend.onrender.com`
2. You should see:
   ```json
   {
     "message": "Code Tutor API is running",
     "version": "1.0.0",
     "endpoints": { ... }
   }
   ```
3. If you see this, backend is working! ✅

### Step 8: Update CORS (After Frontend Deploys)

After you deploy the frontend:
1. Go back to backend service → **"Environment"** tab
2. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```
3. Click **"Save Changes"**
4. Render will automatically redeploy

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify `backend/package.json` exists
- Check Node.js version (should be 18+)
- Ensure Root Directory is set to `backend`

### Database Connection Fails
- Verify `MONGODB_URI` is correct
- For Render MongoDB: Use Internal Database URL
- For MongoDB Atlas: Check IP whitelist (should include `0.0.0.0/0`)
- Check database user credentials

### Service Keeps Crashing
- Check logs in Render dashboard
- Verify all environment variables are set
- Check PORT is set to `10000`
- Look for MongoDB connection errors

### Service Spins Down (Free Tier)
- Free tier services spin down after 15 min inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading to Starter plan ($7/month) for always-on

---

## Environment Variables Checklist

Before deploying, make sure you have:

- [ ] `MONGODB_URI` - Database connection string
- [ ] `JWT_SECRET` - Random 32+ character string
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `FRONTEND_URL` - (Set after frontend deploys)

---

## Quick Reference

**Backend URL Format**: `https://your-service-name.onrender.com`

**MongoDB Internal URL Format**: `mongodb://user:pass@host:port/database?options`

**Render Free Tier**: 
- Spins down after 15 min
- 512 MB RAM
- 100 GB bandwidth/month

**Render Starter Plan** ($7/month):
- Always on
- 512 MB RAM
- Better for production

---

## Next Steps After Backend Deployment

1. ✅ Test backend is accessible
2. ✅ Copy backend URL
3. ✅ Deploy frontend (Netlify or Render)
4. ✅ Update backend `FRONTEND_URL`
5. ✅ Test full application

---

## Support

If you encounter issues:
1. Check Render build/deploy logs
2. Verify all environment variables
3. Check service logs for errors
4. Ensure MongoDB is accessible
5. Verify CORS configuration

