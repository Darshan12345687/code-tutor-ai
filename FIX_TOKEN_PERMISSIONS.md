# Fix Fine-Grained Token Permissions

The token is authenticated but doesn't have write permissions to the repository. Fine-grained tokens need specific permissions configured.

## ✅ Solution: Update Token Permissions

### Option 1: Update Existing Fine-Grained Token

1. **Go to Token Settings**:
   - Visit: https://github.com/settings/tokens
   - Find your token (the one starting with `github_pat_11AXPCIFQ0...`)
   - Click on it to edit

2. **Configure Repository Access**:
   - Under "Repository access":
     - Select "Only select repositories"
     - Add: `code-tutor-ai`
     - Or select "All repositories"

3. **Set Permissions**:
   - Under "Repository permissions" → "Contents":
     - Set to **"Read and write"** ✅
   - Under "Repository permissions" → "Metadata":
     - Set to **"Read-only"** (or "Read and write")
   - Save changes

4. **Try Pushing Again**:
   ```bash
   cd "/Users/darshanadhikari/CODE(codetutor) copy"
   git push -u origin main
   ```

### Option 2: Create Classic Token (Easier)

Fine-grained tokens can be complex. A classic token is simpler:

1. **Create Classic Token**:
   - Go to: https://github.com/settings/tokens/new
   - Click "Generate new token (classic)"
   - Name: "CodeTutor AI Push"
   - Expiration: Your choice
   - **Scopes**: Check ✅ `repo` (Full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (starts with `ghp_`)

2. **Use the Classic Token**:
   ```bash
   cd "/Users/darshanadhikari/CODE(codetutor) copy"
   
   # Set remote with classic token
   git remote set-url origin https://YOUR_CLASSIC_TOKEN@github.com/Darshan12345687/code-tutor-ai.git
   
   # Push
   git push -u origin main
   ```

### Option 3: Use GitHub CLI (Recommended)

GitHub CLI handles authentication automatically:

```bash
# Make sure you're logged in
gh auth status

# If not logged in or need to re-authenticate:
gh auth login
# Choose: GitHub.com, HTTPS, Yes to authenticate Git

# Then push
cd "/Users/darshanadhikari/CODE(codetutor) copy"
git push -u origin main
```

## Verify Token Permissions

After updating, check if you have write access:

```bash
gh repo view Darshan12345687/code-tutor-ai --json viewerPermission
```

You should see: `"viewerPermission": "ADMIN"` or `"WRITE"`

## Current Status

- ✅ Repository exists: https://github.com/Darshan12345687/code-tutor-ai
- ✅ Local Git initialized
- ✅ Remote configured
- ✅ Code committed
- ❌ Token needs write permissions

Once the token has write permissions, the push will work!

