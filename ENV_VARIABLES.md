# Environment Variables for Deployment

## Backend Environment Variables

Copy these into your Railway/Render/Heroku environment variables:

### Required Variables:

```bash
# MongoDB Connection String
# Get this from Railway MongoDB service or MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codetutor?retryWrites=true&w=majority

# JWT Secret (32+ character random string)
# Use the generated one below or create your own
JWT_SECRET=your_generated_secret_here

# Node Environment
NODE_ENV=production

# Server Port
PORT=8000

# Frontend URL (set this after frontend deploys)
FRONTEND_URL=https://your-app.netlify.app
```

### Optional AI Service Keys:

```bash
# OpenAI API Key (optional)
OPENAI_API_KEY=sk-your-openai-key

# Google Gemini API Key (optional)
GEMINI_API_KEY=your-gemini-key

# Mistral AI API Key (optional)
MISTRAL_API_KEY=your-mistral-key
```

---

## How to Get MONGODB_URI

### If using Railway MongoDB:
1. In Railway dashboard, click on your MongoDB service
2. Go to "Variables" tab
3. Copy the `MONGO_URL` value
4. Use it as `MONGODB_URI`

### If using MongoDB Atlas:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Clusters → Connect → Connect your application
3. Copy the connection string
4. Replace `<password>` with your database password
5. Use it as `MONGODB_URI`

---

## Generated JWT_SECRET

Use this secure random secret (or generate your own):

```
REPLACE_WITH_GENERATED_SECRET
```

**To generate your own:**
```bash
# On macOS/Linux:
openssl rand -base64 32

# Or using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Frontend Environment Variables (Netlify)

```bash
REACT_APP_API_URL=https://your-backend.railway.app
```

Replace `https://your-backend.railway.app` with your actual backend URL.

---

## Quick Copy-Paste Template

### For Railway/Render Backend:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_secret_here
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://your-app.netlify.app
```

### For Netlify Frontend:

```
REACT_APP_API_URL=https://your-backend.railway.app
```

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` files to Git
- Keep your JWT_SECRET secure and don't share it
- Use different secrets for development and production
- Rotate secrets periodically
- Don't expose API keys in client-side code

