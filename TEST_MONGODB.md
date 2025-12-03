# Test Your MongoDB Connection String

## Your Connection String Format

You provided:
```
mongodb+srv://<db_username>:<db_password>@cluster0.j8hvx.mongodb.net/
```

## Complete Connection String

Based on your previous information, your complete connection string should be:

```
mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
```

**Replace:**
- `<db_username>` → `codetutor`
- `<db_password>` → `CODETUTOR`
- Add database name: `/codetutor`
- Add options: `?retryWrites=true&w=majority`

---

## Test the Connection

### Option 1: Test Locally (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a test file** (or use the provided one):
   ```bash
   node test-mongodb-connection.js
   ```

3. **Or test with environment variable:**
   ```bash
   MONGODB_URI="mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority" node test-mongodb-connection.js
   ```

### Option 2: Test in MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click "Database" → Your cluster
3. Click "Browse Collections"
4. If you can see collections, connection works!

### Option 3: Test with MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Paste your connection string
3. Click "Connect"
4. If it connects, it works!

---

## Common Issues and Solutions

### ❌ Authentication Failed
**Error**: `authentication failed`

**Solutions**:
- Verify username: `codetutor`
- Verify password: `CODETUTOR` (case-sensitive)
- Check database user exists in Atlas
- Ensure user has proper permissions

### ❌ IP Not Whitelisted
**Error**: `IP address not whitelisted` or connection timeout

**Solutions**:
1. Go to MongoDB Atlas → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (`0.0.0.0/0`)
4. Wait 1-2 minutes for changes to propagate

### ❌ Invalid Connection String Format
**Error**: `Invalid connection string`

**Solutions**:
- Ensure format: `mongodb+srv://username:password@cluster/database?options`
- No spaces in connection string
- Special characters in password need URL encoding:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `+` → `%2B`
  - `=` → `%3D`

### ❌ Cluster Not Found
**Error**: `getaddrinfo ENOTFOUND` or `cluster not found`

**Solutions**:
- Verify cluster name: `cluster0.j8hvx.mongodb.net`
- Check cluster is running in Atlas
- Ensure cluster hasn't been deleted

---

## Quick Test Checklist

Before using in Render, verify:

- [ ] Connection string has actual username (not `<db_username>`)
- [ ] Connection string has actual password (not `<db_password>`)
- [ ] Database name is included (`/codetutor`)
- [ ] Options are included (`?retryWrites=true&w=majority`)
- [ ] IP address `0.0.0.0/0` is whitelisted in Atlas
- [ ] Database user exists and has correct permissions
- [ ] Test connection locally works
- [ ] Connection string has no spaces or typos

---

## For Render Deployment

Once you've verified the connection works locally:

1. **Go to Render Dashboard**
2. **Backend Service → Environment tab**
3. **Add variable:**
   - Key: `MONGODB_URI`
   - Value: `mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority`
4. **Save and redeploy**

---

## Test Script

I've created `test-mongodb-connection.js` in the root directory. To use it:

```bash
cd backend
node ../test-mongodb-connection.js
```

Or set the environment variable:
```bash
MONGODB_URI="mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority" node test-mongodb-connection.js
```

---

## Expected Output

If connection works, you should see:
```
🔍 Testing MongoDB Connection...
Connection String: mongodb+srv://codetutor:****@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
✅ SUCCESS: Connected to MongoDB Atlas!
✅ Database: codetutor
✅ Host: cluster0-shard-00-00.j8hvx.mongodb.net
```

If it fails, you'll see specific error messages with solutions.

