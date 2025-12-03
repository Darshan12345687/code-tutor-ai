#!/bin/bash

# Quick GitHub Setup Script
# This script helps you connect your local repository to GitHub

echo "🚀 CodeTutor AI - GitHub Setup"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized"
    echo "Run: git init"
    exit 1
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Get repository name
read -p "Enter repository name (default: codetutor-ai): " REPO_NAME
REPO_NAME=${REPO_NAME:-codetutor-ai}

# Ask if repository already exists
echo ""
read -p "Have you already created the repository on GitHub? (y/n): " REPO_EXISTS

if [ "$REPO_EXISTS" != "y" ] && [ "$REPO_EXISTS" != "Y" ]; then
    echo ""
    echo "📝 Please create the repository on GitHub first:"
    echo "   1. Go to https://github.com/new"
    echo "   2. Repository name: $REPO_NAME"
    echo "   3. DO NOT initialize with README, .gitignore, or license"
    echo "   4. Click 'Create repository'"
    echo ""
    read -p "Press Enter after you've created the repository..."
fi

# Set remote URL
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
echo "🔗 Adding GitHub remote..."
git remote add origin "$GITHUB_URL" 2>/dev/null || git remote set-url origin "$GITHUB_URL"

echo "✅ Remote added: $GITHUB_URL"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "📌 Renaming branch to 'main'..."
    git branch -m "$CURRENT_BRANCH" main
fi

echo ""
echo "📤 Ready to push! Choose an option:"
echo ""
echo "1. Push now (requires authentication)"
echo "2. Show commands to run manually"
echo ""
read -p "Enter choice (1 or 2): " CHOICE

if [ "$CHOICE" == "1" ]; then
    echo ""
    echo "📤 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Success! Your code is now on GitHub!"
        echo "🌐 View it at: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    else
        echo ""
        echo "❌ Push failed. This might be due to authentication."
        echo ""
        echo "💡 Try one of these solutions:"
        echo "   1. Use Personal Access Token (Settings → Developer settings → Personal access tokens)"
        echo "   2. Use GitHub CLI: gh auth login"
        echo "   3. Set up SSH keys"
        echo ""
        echo "Or run manually:"
        echo "   git push -u origin main"
    fi
else
    echo ""
    echo "📋 Run these commands manually:"
    echo ""
    echo "   git push -u origin main"
    echo ""
    echo "If you get authentication errors, see GITHUB_SETUP.md for solutions."
fi

echo ""
echo "✨ Next steps:"
echo "   1. Deploy backend (Railway/Render/Heroku)"
echo "   2. Deploy frontend to Netlify"
echo "   3. See DEPLOYMENT_QUICKSTART.md for details"
echo ""

