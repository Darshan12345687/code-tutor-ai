# GitHub Repository Setup Guide

Your local Git repository is ready! Follow these steps to create a GitHub repository and push your code.

## Step 1: Create GitHub Repository

### Option A: Using GitHub Website (Recommended)

1. **Go to GitHub**: Visit [github.com](https://github.com) and sign in (or create an account)

2. **Create New Repository**:
   - Click the **"+"** icon in the top right corner
   - Select **"New repository"**

3. **Repository Settings**:
   - **Repository name**: `codetutor-ai` (or your preferred name)
   - **Description**: "CodeTutor AI - Interactive coding tutor platform"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click **"Create repository"**

4. **Copy the Repository URL**: 
   - GitHub will show you the repository URL
   - It will look like: `https://github.com/yourusername/codetutor-ai.git`
   - **Copy this URL** - you'll need it in the next step

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create codetutor-ai --public --source=. --remote=origin --push
```

## Step 2: Connect Local Repository to GitHub

After creating the repository on GitHub, run these commands in your terminal:

```bash
cd "/Users/darshanadhikari/CODE(codetutor) copy"

# Add GitHub as remote (replace YOUR_USERNAME and REPO_NAME with your actual values)
git remote add origin https://github.com/YOUR_USERNAME/codetutor-ai.git

# Verify remote was added
git remote -v

# Push your code to GitHub
git push -u origin main
```

**Note**: If you get an authentication error, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys
- Or use GitHub CLI: `gh auth login`

## Step 3: Verify Push

1. Go back to your GitHub repository page
2. Refresh the page
3. You should see all your files uploaded!

## Step 4: Set Up for Netlify Deployment

Now that your code is on GitHub, you can deploy to Netlify:

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your `codetutor-ai` repository
6. Configure build settings:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/build`
7. Add environment variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: Your backend URL (after you deploy backend)
8. Click **"Deploy site"**

## Troubleshooting

### Authentication Issues

If `git push` asks for credentials:

**Option 1: Use Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Use the token as your password when pushing

**Option 2: Use SSH**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Copy public key: cat ~/.ssh/id_ed25519.pub

# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/codetutor-ai.git
```

**Option 3: Use GitHub CLI**
```bash
# Install GitHub CLI if not installed
brew install gh  # macOS
# or download from: https://cli.github.com

# Login
gh auth login

# Then push normally
git push -u origin main
```

### Branch Name Issues

If you get an error about branch name:
```bash
# Check current branch
git branch

# If it's 'master', rename to 'main'
git branch -m master main

# Push again
git push -u origin main
```

### Large Files Warning

If you see warnings about large files:
- Check `.gitignore` is properly excluding `node_modules/`, `build/`, etc.
- If needed, remove large files: `git rm --cached large-file.txt`

## Next Steps

After pushing to GitHub:

1. ✅ **Deploy Backend** (Railway, Render, or Heroku)
2. ✅ **Deploy Frontend to Netlify** (connect to your GitHub repo)
3. ✅ **Set Environment Variables** in both platforms
4. ✅ **Update CORS** in backend with Netlify URL

See `DEPLOYMENT_QUICKSTART.md` for detailed deployment instructions.

## Quick Command Reference

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# View remote
git remote -v
```

