# Your MongoDB Atlas Connection String

## Complete Connection String

Based on your MongoDB Atlas cluster, here's your complete connection string:

```
mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
```

## Breakdown:
- **Username**: `codetutor`
- **Password**: `CODETUTOR`
- **Cluster**: `cluster0.j8hvx.mongodb.net`
- **Database**: `codetutor` (added)
- **Options**: `retryWrites=true&w=majority` (added for reliability)

---

## Use in Render

### Step 1: Set Environment Variable in Render

1. Go to your **Render backend service**
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:
   - **Key**: `MONGODB_URI`
   - **Value**: 
     ```
     mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
     ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Important: Whitelist IP Addresses

Before this will work, make sure MongoDB Atlas allows connections from Render:

1. **Go to MongoDB Atlas Dashboard**
2. **Click "Network Access"** (left sidebar)
3. **Click "Add IP Address"**
4. **Click "Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to whitelist
5. **Click "Confirm"**

Without this, Render won't be able to connect to your database.

---

## Verify Connection

After setting the environment variable:

1. **Check Render Logs**
   - Go to your backend service → "Logs" tab
   - Look for: `✅ Connected to MongoDB`
   - If you see this, connection is successful!

2. **Test API**
   - Visit: `https://your-backend.onrender.com`
   - Should see API response

---

## Complete Environment Variables for Render

Make sure you have all these set:

```bash
MONGODB_URI=mongodb+srv://codetutor:CODETUTOR@cluster0.j8hvx.mongodb.net/codetutor?retryWrites=true&w=majority
JWT_SECRET=672a3a3641e3cb7e67e2f0d72081989e99e44ba0fb315c7c9ae85d319c99caa5
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.onrender.com
```

---

## Security Note

⚠️ **Important**: Your password is visible in the connection string. Make sure:
- This is a development/test database, OR
- You're okay with this password being in environment variables
- For production, consider using a stronger password

---

## Troubleshooting

### Connection Fails
- Check IP whitelist includes `0.0.0.0/0`
- Verify username and password are correct
- Ensure database user has proper permissions

### Authentication Error
- Double-check username: `codetutor`
- Double-check password: `CODETUTOR` (case-sensitive)
- Verify database user exists in Atlas

### Database Not Found
- Database `codetutor` will be created automatically on first connection
- Or create it manually in Atlas if needed

