# Netlify Deployment Guide

This guide will help you deploy the CodeTutor frontend to Netlify. The backend needs to be deployed separately (see Backend Deployment section).

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://www.netlify.com))
2. Your backend API deployed and accessible (see Backend Deployment options below)
3. Git repository for your code (GitHub, GitLab, or Bitbucket)

## Frontend Deployment Steps

### Step 1: Prepare Your Repository

1. Make sure all your changes are committed to Git:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push
   ```

### Step 2: Set Up Environment Variables

Before deploying, you need to set the backend API URL as an environment variable in Netlify.

**Option A: Set via Netlify Dashboard (Recommended)**
1. Go to your site settings in Netlify
2. Navigate to **Site settings** → **Environment variables**
3. Add a new variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend API URL (e.g., `https://your-backend-api.herokuapp.com` or `https://api.yourdomain.com`)

**Option B: Set via netlify.toml (for build-time)**
The `netlify.toml` file is already configured. Environment variables set in the Netlify dashboard will be available during build.

### Step 3: Deploy to Netlify

**Option A: Deploy via Netlify Dashboard (Recommended for first deployment)**

1. Log in to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Configure build settings:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/build`
   - **Base directory**: (leave empty or set to root)
6. Click **"Deploy site"**

**Option B: Deploy via Netlify CLI**

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   cd frontend
   netlify init
   netlify deploy --prod
   ```

### Step 4: Verify Deployment

1. After deployment, Netlify will provide you with a URL (e.g., `https://your-app.netlify.app`)
2. Visit the URL and test the application
3. Check the browser console for any API connection errors
4. Verify that the frontend can connect to your backend API

## Backend Deployment Options

Since Netlify is primarily for static sites and serverless functions, you'll need to deploy your backend separately. Here are recommended options:

### Option 1: Railway (Recommended)
- **Pros**: Easy setup, good free tier, supports MongoDB, WebSockets
- **Steps**:
  1. Sign up at [railway.app](https://railway.app)
  2. Create a new project
  3. Connect your GitHub repository
  4. Add MongoDB service
  5. Set environment variables
  6. Deploy

### Option 2: Render
- **Pros**: Free tier available, easy MongoDB integration
- **Steps**:
  1. Sign up at [render.com](https://render.com)
  2. Create a new Web Service
  3. Connect your repository
  4. Set build command: `cd backend && npm install`
  5. Set start command: `cd backend && npm start`
  6. Add MongoDB database
  7. Set environment variables

### Option 3: Heroku
- **Pros**: Well-established platform
- **Note**: Free tier discontinued, paid plans available
- **Steps**:
  1. Sign up at [heroku.com](https://heroku.com)
  2. Create a new app
  3. Connect GitHub repository
  4. Add MongoDB Atlas (free tier available)
  5. Set environment variables
  6. Deploy

### Option 4: DigitalOcean App Platform
- **Pros**: Good performance, reasonable pricing
- **Steps**:
  1. Sign up at [digitalocean.com](https://digitalocean.com)
  2. Create a new App
  3. Connect your repository
  4. Configure build and run commands
  5. Add MongoDB database
  6. Set environment variables

## Environment Variables for Backend

Your backend will need these environment variables (set them in your backend hosting platform):

```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# API Keys (for AI services)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
MISTRAL_API_KEY=your_mistral_key

# Server
PORT=8000
NODE_ENV=production

# CORS - Update this with your Netlify frontend URL
CORS_ORIGIN=https://your-app.netlify.app
```

## Updating Backend CORS Configuration

After deploying your frontend, update the backend CORS configuration to allow requests from your Netlify URL.

In `backend/server.js`, update the CORS origin:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://your-app.netlify.app',  // Add your Netlify URL
    'https://*.netlify.app'  // Or use wildcard for all Netlify previews
  ],
  credentials: true
}));
```

## Updating Remaining Frontend Files

Some frontend components still have hardcoded API URLs. To update them:

1. Import the API config utility:
   ```typescript
   import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
   ```

2. Replace hardcoded URLs:
   ```typescript
   // Before
   axios.get('http://localhost:8000/api/quizzes')
   
   // After
   axios.get(getApiUrl(API_ENDPOINTS.QUIZZES.LIST))
   ```

Files that may still need updates:
- `components/Quiz/QuizPanel.tsx`
- `components/Voice/VoiceAssistant.tsx`
- `components/Tutor/TutorDashboard.tsx`
- `components/Student/AppointmentBooking.tsx`
- `components/DataStructuresPanel.tsx`
- `components/Auth/TutorLogin.tsx`

## Continuous Deployment

Once connected to Git, Netlify will automatically deploy:
- Every push to the main/master branch (production)
- Every pull request (preview deployments)

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure `frontend/package.json` has all dependencies
- Verify Node version (set in `netlify.toml`)

### API Connection Errors
- Verify `REACT_APP_API_URL` is set correctly in Netlify
- Check backend CORS configuration includes your Netlify URL
- Ensure backend is deployed and accessible
- Check browser console for specific error messages

### Environment Variables Not Working
- Environment variables must start with `REACT_APP_` to be available in React
- Rebuild the site after adding new environment variables
- Check that variables are set in the correct environment (production vs. deploy previews)

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)

## Support

If you encounter issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify backend is running and accessible
4. Ensure all environment variables are set correctly

