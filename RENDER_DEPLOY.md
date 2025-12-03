# Deploy CodeTutor AI to Render

Complete guide to deploy both backend and frontend to Render.

## Prerequisites

- GitHub repository: https://github.com/Darshan12345687/code-tutor-ai
- Render account: [render.com](https://render.com) (free tier available)
- MongoDB database (MongoDB Atlas recommended - free tier available)

---

## Part 1: Deploy Backend to Render

### Step 1: Sign Up / Sign In

1. Go to [render.com](https://render.com)
2. Sign up or sign in with GitHub
3. Authorize Render to access your GitHub account

### Step 2: Create Web Service (Backend)

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if not connected
   - Select **"code-tutor-ai"** repository
   - Click **"Connect"**

### Step 3: Configure Backend Service

Fill in the service configuration:

- **Name**: `codetutor-backend` (or your preferred name)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: 
  - **Free**: 512 MB RAM (good for testing)
  - **Starter**: $7/month (recommended for production)

### Step 4: Add MongoDB Database

1. Click **"New +"** → **"MongoDB"**
2. Configure:
   - **Name**: `codetutor-db`
   - **Database**: `codetutor` (or leave default)
   - **Plan**: **Free** (512 MB) or **Starter** ($15/month)
   - **Region**: Same as your backend service
3. Click **"Create Database"**
4. Wait for database to be created
5. Copy the **Internal Database URL** (starts with `mongodb://`)

### Step 5: Set Environment Variables

1. Go back to your backend service
2. Click on **"Environment"** tab
3. Click **"Add Environment Variable"** for each:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/codetutor
# Replace with your Render MongoDB Internal Database URL

# JWT Secret (use the generated one)
JWT_SECRET=672a3a3641e3cb7e67e2f0d72081989e99e44ba0fb315c7c9ae85d319c99caa5

# Node Environment
NODE_ENV=production

# Server Port (Render sets this automatically, but include it)
PORT=10000

# Frontend URL (set after frontend deploys)
FRONTEND_URL=https://your-app.onrender.com
```

**Important**: 
- Use the **Internal Database URL** from Render MongoDB (starts with `mongodb://`)
- For Render MongoDB, use the internal URL, not the external one
- PORT is usually set automatically by Render, but 10000 is the default

### Step 6: Deploy Backend

1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (5-10 minutes)
4. Copy your backend URL (e.g., `https://codetutor-backend.onrender.com`)

### Step 7: Update CORS (After Frontend Deploys)

After you deploy the frontend, come back and update:
- `FRONTEND_URL` environment variable with your frontend URL

---

## Part 2: Deploy Frontend to Render

### Step 1: Create Static Site

1. In Render dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect repository:
   - Select **"code-tutor-ai"** repository
   - Click **"Connect"**

### Step 2: Configure Frontend

Fill in the configuration:

- **Name**: `codetutor-frontend` (or your preferred name)
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`
- **Environment**: `Node`

### Step 3: Set Environment Variables

1. Go to **"Environment"** tab
2. Click **"Add Environment Variable"**:

```bash
REACT_APP_API_URL=https://codetutor-backend.onrender.com
```

Replace with your actual backend URL from Part 1.

### Step 4: Deploy Frontend

1. Click **"Create Static Site"**
2. Render will build and deploy
3. Wait for deployment (5-10 minutes)
4. Copy your frontend URL (e.g., `https://codetutor-frontend.onrender.com`)

---

## Part 3: Update Backend CORS

After frontend is deployed:

1. Go to your backend service
2. Click **"Environment"** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://codetutor-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## Part 4: Alternative - Use MongoDB Atlas

If you prefer MongoDB Atlas (free tier):

### Setup MongoDB Atlas:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Sign in
3. Create a free cluster (M0)
4. Create database user:
   - Database Access → Add New User
   - Username/Password (save these!)
5. Whitelist IP:
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
6. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database password

### Use in Render:

In your backend environment variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codetutor?retryWrites=true&w=majority
```

---

## Environment Variables Summary

### Backend (Render Web Service):

```bash
MONGODB_URI=mongodb://localhost:27017/codetutor  # Use Render MongoDB internal URL
JWT_SECRET=672a3a3641e3cb7e67e2f0d72081989e99e44ba0fb315c7c9ae85d319c99caa5
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://codetutor-frontend.onrender.com  # Set after frontend deploys
```

### Frontend (Render Static Site):

```bash
REACT_APP_API_URL=https://codetutor-backend.onrender.com
```

---

## Render Service URLs

After deployment, you'll have:

- **Backend**: `https://codetutor-backend.onrender.com`
- **Frontend**: `https://codetutor-frontend.onrender.com`

**Note**: Free tier services spin down after 15 minutes of inactivity. First request after spin-down takes 30-60 seconds.

---

## Troubleshooting

### Backend Issues:

**Build Fails**:
- Check build logs in Render dashboard
- Verify `backend/package.json` exists
- Check Node.js version (should be 18+)

**Database Connection Fails**:
- Verify `MONGODB_URI` is correct
- Use Internal Database URL for Render MongoDB
- Check MongoDB Atlas IP whitelist if using Atlas

**Service Keeps Crashing**:
- Check logs in Render dashboard
- Verify all environment variables are set
- Check PORT is set correctly (10000 for Render)

### Frontend Issues:

**Build Fails**:
- Check build logs
- Verify `REACT_APP_API_URL` is set
- Check Node.js version

**API Calls Fail**:
- Verify `REACT_APP_API_URL` matches backend URL
- Check browser console for CORS errors
- Ensure backend is running

**CORS Errors**:
- Update backend `FRONTEND_URL` environment variable
- Verify CORS configuration in `backend/server.js`

---

## Render Free Tier Limitations

- **Web Services**: Spin down after 15 min inactivity
- **Static Sites**: Always on (no spin-down)
- **MongoDB**: 512 MB storage (free tier)
- **Bandwidth**: 100 GB/month

For production, consider upgrading to paid plans:
- **Starter Web Service**: $7/month (always on)
- **Starter MongoDB**: $15/month (1 GB storage)

---

## Quick Deployment Checklist

### Backend:
- [ ] Create Web Service
- [ ] Set Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Add MongoDB database
- [ ] Set environment variables
- [ ] Deploy and copy backend URL

### Frontend:
- [ ] Create Static Site
- [ ] Set Root Directory: `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `build`
- [ ] Set `REACT_APP_API_URL`
- [ ] Deploy and copy frontend URL

### Final:
- [ ] Update backend `FRONTEND_URL`
- [ ] Test frontend → backend connection
- [ ] Verify CORS is working

---

## Support

If you encounter issues:
1. Check Render build/deploy logs
2. Verify all environment variables
3. Check service logs for errors
4. Ensure MongoDB is accessible
5. Verify CORS configuration

---

## Next Steps

After deployment:
1. Test your application
2. Set up custom domains (optional)
3. Configure auto-deploy from GitHub
4. Set up monitoring and alerts
5. Consider upgrading to paid plans for production

