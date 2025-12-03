# How to Get Your Database URL

You need a MongoDB connection string. Here are your options:

## Option 1: Use Render MongoDB (Easiest - Recommended)

If you created a MongoDB service in Render:

1. **Go to Render Dashboard**
2. **Click on your MongoDB service** (e.g., `codetutor-db`)
3. **Go to "Info" tab**
4. **Look for "Internal Database URL"**
5. **Copy the URL** - it will look like:
   ```
   mongodb://d0-db-user-0:password@d0-shard-00-00.xxxxx.mongodb.net:27017,d0-shard-00-01.xxxxx.mongodb.net:27017,d0-shard-00-02.xxxxx.mongodb.net:27017/codetutor?replicaSet=atlas-xxxxx-shard-0&ssl=true&authSource=admin
   ```

**Important**: Use the **Internal Database URL**, not the external one. The internal URL works better for Render services.

---

## Option 2: Use MongoDB Atlas (Free Tier Available)

If you want to use MongoDB Atlas instead:

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free (or sign in)

### Step 2: Create Cluster
1. Click **"Build a Database"**
2. Choose **FREE** (M0) tier
3. Select a cloud provider and region (closest to you)
4. Click **"Create"**
5. Wait 3-5 minutes for cluster to be created

### Step 3: Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username**: `codetutor-user` (or your choice)
   - **Password**: Generate secure password (save it!)
5. Set privileges: **"Atlas Admin"** (or "Read and write to any database")
6. Click **"Add User"**

### Step 4: Whitelist IP Address
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - Or add specific IPs if you prefer
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** (left sidebar) → **"Clusters"**
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. **Copy the connection string** - it will look like:
   ```
   mongodb+srv://codetutor-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with your actual database user password
7. **Add database name** at the end:
   ```
   mongodb+srv://codetutor-user:yourpassword@cluster0.xxxxx.mongodb.net/codetutor?retryWrites=true&w=majority
   ```

---

## Format Examples

### Render MongoDB (Internal):
```
mongodb://user:password@host1:27017,host2:27017,host3:27017/database?replicaSet=rs0&ssl=true&authSource=admin
```

### MongoDB Atlas:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/codetutor?retryWrites=true&w=majority
```

---

## Use in Render Environment Variables

Once you have your database URL:

1. Go to your **backend service** in Render
2. Click **"Environment"** tab
3. Add variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your database URL (paste it here)
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## Quick Checklist

- [ ] Created MongoDB (Render or Atlas)
- [ ] Created database user
- [ ] Whitelisted IP addresses (for Atlas)
- [ ] Copied connection string
- [ ] Replaced `<password>` with actual password (for Atlas)
- [ ] Added database name to connection string (for Atlas)
- [ ] Set `MONGODB_URI` in Render environment variables

---

## Troubleshooting

### Connection Failed
- Verify password is correct (no special characters need encoding)
- Check IP whitelist includes `0.0.0.0/0` (for Atlas)
- Ensure database user has correct permissions
- Verify connection string format is correct

### Can't Find Internal Database URL (Render)
- Make sure MongoDB service is fully created
- Check "Info" tab in MongoDB service
- Look for "Internal Database URL" or "Connection String"

### Password Has Special Characters
- URL encode special characters:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `+` → `%2B`
  - `=` → `%3D`

---

## Need Help?

If you're stuck:
1. Check Render/MongoDB Atlas documentation
2. Verify all steps above are completed
3. Check service logs in Render dashboard
4. Ensure database is accessible and running

