# MongoDB Authentication Error - How to Fix

## ❌ Error: "bad auth : Authentication failed"

This means your username or password is incorrect, or the database user doesn't exist.

## Step-by-Step Fix

### Step 1: Verify Database User in MongoDB Atlas

1. **Go to MongoDB Atlas Dashboard**
   - Visit [cloud.mongodb.com](https://cloud.mongodb.com)
   - Sign in

2. **Check Database Users**
   - Click **"Database Access"** (left sidebar)
   - Look for a user with username: `codetutor`
   - If it doesn't exist, you need to create it

### Step 2: Create Database User (If Needed)

If user doesn't exist:

1. **Click "Add New Database User"**
2. **Choose "Password" authentication**
3. **Enter:**
   - **Username**: `codetutor` (or your preferred username)
   - **Password**: Create a secure password (save it!)
   - **Database User Privileges**: Select **"Atlas Admin"** (or "Read and write to any database")
4. **Click "Add User"**
5. **Wait 1-2 minutes** for user to be created

### Step 3: Get Correct Credentials

1. **Go to "Database Access"**
2. **Find your user** (username: `codetutor` or whatever you created)
3. **Note the exact username** (case-sensitive)
4. **If you forgot the password:**
   - Click the user → "Edit" → "Edit Password"
   - Set a new password (remember it!)

### Step 4: Update Connection String

Use the **actual** username and password:

```
mongodb+srv://[ACTUAL_USERNAME]:[ACTUAL_PASSWORD]@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
```

**Example** (if username is `codetutor` and password is `MyPassword123`):
```
mongodb+srv://codetutor:MyPassword123@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
```

### Step 5: URL Encode Password (If Needed)

If your password has special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example**: Password `P@ss#123` becomes `P%40ss%23123`

### Step 6: Whitelist IP Address

1. **Go to "Network Access"** (left sidebar)
2. **Click "Add IP Address"**
3. **Click "Allow Access from Anywhere"** (`0.0.0.0/0`)
4. **Click "Confirm"**
5. **Wait 1-2 minutes** for changes to apply

### Step 7: Test Again

After fixing credentials, test the connection:

```bash
cd backend
MONGODB_URI="mongodb+srv://[username]:[password]@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority" node -e "import('mongoose').then(m => m.default.connect(process.env.MONGODB_URI).then(() => {console.log('✅ Connected!'); process.exit(0);}).catch(e => {console.error('❌', e.message); process.exit(1);}));"
```

---

## Common Issues

### Issue 1: User Doesn't Exist
**Solution**: Create the database user in Atlas (Step 2 above)

### Issue 2: Wrong Password
**Solution**: 
- Check the exact password in Atlas
- Reset password if needed
- Ensure password is correct (case-sensitive)

### Issue 3: Wrong Username
**Solution**:
- Verify exact username in Atlas
- Username is case-sensitive
- Check for typos

### Issue 4: Special Characters in Password
**Solution**: URL encode special characters (Step 5 above)

### Issue 5: User Has No Permissions
**Solution**: 
- Edit user in Atlas
- Set privileges to "Atlas Admin" or "Read and write to any database"

---

## Quick Checklist

- [ ] Database user exists in MongoDB Atlas
- [ ] Username is correct (case-sensitive)
- [ ] Password is correct (case-sensitive)
- [ ] Password special characters are URL encoded (if any)
- [ ] User has proper permissions (Atlas Admin)
- [ ] IP address `0.0.0.0/0` is whitelisted
- [ ] Connection string format is correct
- [ ] Database name is included (`/codetutor`)

---

## Get Your Actual Credentials

1. **MongoDB Atlas** → **"Database Access"**
2. **Find your user** (or create one)
3. **Note the exact username**
4. **Note or reset the password**
5. **Use these in your connection string**

---

## For Render

Once you have the correct credentials:

1. **Render Dashboard** → **Backend Service** → **Environment**
2. **Set `MONGODB_URI`** with correct username and password
3. **Save and redeploy**

---

## Still Having Issues?

If authentication still fails:
1. Create a new database user with a simple password (no special chars)
2. Test with the new user
3. Once working, you can use it or create a more secure one

