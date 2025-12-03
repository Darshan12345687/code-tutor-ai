# Push Code to GitHub - Authentication Required

Your repository is connected to GitHub, but you need to authenticate to push. Here are your options:

## ✅ Option 1: Use GitHub CLI (Easiest - Recommended)

If you have GitHub CLI installed:

```bash
cd "/Users/darshanadhikari/CODE(codetutor) copy"

# Login to GitHub
gh auth login

# Follow the prompts:
# - Choose GitHub.com
# - Choose HTTPS
# - Authenticate Git with your GitHub credentials? Yes
# - Choose your preferred authentication method

# Then push
git push -u origin main
```

If you don't have GitHub CLI, install it:
```bash
# macOS
brew install gh

# Then run gh auth login
```

## ✅ Option 2: Use Personal Access Token

1. **Create a Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it: "CodeTutor AI Push"
   - Select scopes: Check `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Push using the token**:
   ```bash
   cd "/Users/darshanadhikari/CODE(codetutor) copy"
   git push -u origin main
   ```
   
   When prompted:
   - **Username**: `Darshan12345687`
   - **Password**: Paste your Personal Access Token (not your GitHub password)

## ✅ Option 3: Use SSH (More Secure)

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Optionally set a passphrase
   ```

2. **Add SSH key to GitHub**:
   ```bash
   # Copy your public key
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```
   
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Title: "CodeTutor AI"
   - Paste your public key
   - Click "Add SSH key"

3. **Change remote to SSH**:
   ```bash
   cd "/Users/darshanadhikari/CODE(codetutor) copy"
   git remote set-url origin git@github.com:Darshan12345687/code-tutor-ai.git
   ```

4. **Push**:
   ```bash
   git push -u origin main
   ```

## ✅ Option 4: Use GitHub Desktop

1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. File → Add Local Repository
4. Select your project folder
5. Click "Publish repository"

## Quick Command Reference

After authenticating, run:
```bash
cd "/Users/darshanadhikari/CODE(codetutor) copy"
git push -u origin main
```

## Verify Push

After pushing, visit:
https://github.com/Darshan12345687/code-tutor-ai

You should see all your files!

## Troubleshooting

**403 Forbidden Error**:
- Make sure you're using the correct authentication method
- Verify your Personal Access Token has `repo` permissions
- Check that you're pushing to the correct repository

**Authentication Failed**:
- Try using GitHub CLI: `gh auth login`
- Or use a Personal Access Token instead of password

**Repository Not Found**:
- Verify the repository exists at: https://github.com/Darshan12345687/code-tutor-ai
- Make sure you have write access to the repository

