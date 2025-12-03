# Fix GitHub Token Permission Issue

The token you provided is getting a 403 error, which means it doesn't have the required permissions.

## ✅ Solution: Create a New Token with Correct Permissions

1. **Go to GitHub Token Settings**:
   - Visit: https://github.com/settings/tokens/new
   - Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)

2. **Configure the Token**:
   - **Note**: "CodeTutor AI Push"
   - **Expiration**: Choose your preferred duration (90 days recommended)
   - **Scopes**: **IMPORTANT** - Check these:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
   - Click **"Generate token"**

3. **Copy the New Token**:
   - GitHub will show your token once
   - **Copy it immediately** - you won't see it again!

4. **Use the New Token**:
   ```bash
   cd "/Users/darshanadhikari/CODE(codetutor) copy"
   
   # Set remote with new token
   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/Darshan12345687/code-tutor-ai.git
   
   # Push
   git push -u origin main
   ```

   Replace `YOUR_NEW_TOKEN` with your actual token.

## Alternative: Use GitHub CLI (Easier)

```bash
# Install GitHub CLI
brew install gh

# Login (this handles authentication automatically)
gh auth login

# Push
cd "/Users/darshanadhikari/CODE(codetutor) copy"
git push -u origin main
```

## Why This Happened

The token you used likely:
- Doesn't have the `repo` scope enabled
- Is expired
- Was created for a different purpose (like read-only access)

## Security Note

⚠️ **Important**: After pushing, you should:
1. Remove the token from the remote URL for security
2. Use GitHub CLI or credential helper instead

To remove token from URL:
```bash
git remote set-url origin https://github.com/Darshan12345687/code-tutor-ai.git
```

Then use `gh auth login` or credential helper for future pushes.

