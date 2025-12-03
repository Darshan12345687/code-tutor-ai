# Using MongoDB Atlas with Render

Since you already have MongoDB Atlas set up, here's how to use it with your Render backend deployment.

## Step 1: Get Your MongoDB Atlas Connection String

1. **Go to MongoDB Atlas Dashboard**
   - Visit [cloud.mongodb.com](https://cloud.mongodb.com)
   - Sign in to your account

2. **Navigate to Your Cluster**
   - Click on **"Database"** (left sidebar)
   - Click on your cluster

3. **Get Connection String**
   - Click **"Connect"** button
   - Choose **"Connect your application"**
   - Select:
     - **Driver**: `Node.js`
     - **Version**: `4.1 or later`
   - **Copy the connection string**
   - It will look like:
     ```
     mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

4. **Update the Connection String**
   - Replace `<password>` with your actual database user password
   - Add your database name before the `?`:
     ```
     mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/codetutor?retryWrites=true&w=majority
     ```
   - Replace `codetutor` with your actual database name if different

## Step 2: Whitelist Render IP Addresses

MongoDB Atlas requires IP whitelisting. For Render, you need to allow all IPs:

1. **Go to Network Access** (left sidebar in Atlas)
2. **Click "Add IP Address"**
3. **Click "Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to whitelist
   - This is safe for production if you have proper authentication
4. **Click "Confirm"**

**Alternative**: If you want to be more secure, you can add specific Render IP ranges, but allowing all is simpler and works fine with authentication.

## Step 3: Verify Database User

Make sure you have a database user with proper permissions:

1. **Go to Database Access** (left sidebar)
2. **Check your database user exists**
3. **Verify permissions**: Should have "Atlas Admin" or "Read and write to any database"
4. **Note the username and password** (you'll need these for the connection string)

## Step 4: Set in Render Environment Variables

1. **Go to Render Dashboard**
2. **Click on your backend service** (e.g., `codetutor-backend`)
3. **Go to "Environment" tab**
4. **Click "Add Environment Variable"**
5. **Add**:
   - **Key**: `MONGODB_URI`
   - **Value**: Your complete MongoDB Atlas connection string
     ```
     mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/codetutor?retryWrites=true&w=majority
     ```
6. **Click "Save Changes"**
7. **Render will automatically redeploy** with the new environment variable

## Connection String Format

Your final connection string should look like:

```
mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority
```

**Example**:
```
mongodb+srv://codetutor-user:MySecurePass123@cluster0.abc123.mongodb.net/codetutor?retryWrites=true&w=majority
```

## Important Notes

### Password Encoding
If your password has special characters, you need to URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `/` → `%2F`
- `?` → `%3F`

**Example**: If password is `P@ssw0rd#123`
```
mongodb+srv://user:P%40ssw0rd%23123@cluster0.xxxxx.mongodb.net/codetutor?retryWrites=true&w=majority
```

### Database Name
- Make sure the database name in the connection string matches your actual database
- Default is usually `codetutor` or `test`
- You can create the database in Atlas or it will be created automatically on first connection

### Connection Options
The connection string includes important options:
- `retryWrites=true` - Enables retryable writes
- `w=majority` - Write concern for replica sets

## Testing the Connection

After setting the environment variable:

1. **Check Render Logs**
   - Go to your backend service → "Logs" tab
   - Look for: `✅ Connected to MongoDB`
   - If you see connection errors, check the connection string format

2. **Test API Endpoint**
   - Visit your backend URL: `https://your-backend.onrender.com`
   - You should see the API response
   - If MongoDB connection fails, you'll see an error

## Troubleshooting

### Connection Timeout
- **Check IP Whitelist**: Ensure `0.0.0.0/0` is in Network Access
- **Verify Connection String**: Check username, password, and cluster name
- **Check Database User**: Ensure user exists and has correct permissions

### Authentication Failed
- **Verify Password**: Make sure password is correct (no typos)
- **URL Encode Special Characters**: If password has special chars, encode them
- **Check Username**: Ensure username matches exactly

### Database Not Found
- **Check Database Name**: Verify database name in connection string
- **Create Database**: Database will be created automatically on first connection, or create it manually in Atlas

### Connection String Format Error
- **Verify Format**: Should start with `mongodb+srv://`
- **Check Special Characters**: Ensure password is properly encoded
- **No Spaces**: Connection string should have no spaces

## Complete Environment Variables for Render

Make sure you have all these set in Render:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/codetutor?retryWrites=true&w=majority
JWT_SECRET=672a3a3641e3cb7e67e2f0d72081989e99e44ba0fb315c7c9ae85d319c99caa5
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.onrender.com
```

## Quick Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Database user exists with correct permissions
- [ ] IP whitelist includes `0.0.0.0/0` (or Render IPs)
- [ ] Connection string copied from Atlas
- [ ] Password replaced in connection string
- [ ] Database name added to connection string
- [ ] Special characters in password are URL encoded (if any)
- [ ] `MONGODB_URI` set in Render environment variables
- [ ] Backend service redeployed
- [ ] Checked logs for successful connection

## Need Help?

If you're having issues:
1. Check MongoDB Atlas connection string format
2. Verify IP whitelist settings
3. Check Render logs for specific error messages
4. Ensure database user credentials are correct
5. Verify connection string has no typos or extra spaces

