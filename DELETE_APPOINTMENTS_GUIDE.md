# Delete All Appointments Guide

## Option 1: Using API Endpoint (Easiest)

If your backend server is running, you can use this API call:

### Using cURL:

```bash
curl -X DELETE http://localhost:8000/api/appointments \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### Using Postman:

**Method:** DELETE  
**URL:** `http://localhost:8000/api/appointments`  
**Headers:**
- `Authorization: Bearer YOUR_ADMIN_TOKEN_HERE`

**Note:** You need to be an admin user to delete all appointments.

---

## Option 2: Using Script

### Step 1: Make sure MongoDB is running

If using local MongoDB:
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"
```

If using MongoDB Atlas (cloud), the connection string should be in your `.env` file.

### Step 2: Run the script

```bash
cd backend
node scripts/delete-all-appointments.js
```

---

## Option 3: Delete via MongoDB Directly

If you have direct MongoDB access:

```bash
mongosh codetutor
```

Then run:
```javascript
db.appointments.deleteMany({})
```

Or if using MongoDB Compass:
1. Connect to your database
2. Go to `appointments` collection
3. Click "Delete" or run: `db.appointments.deleteMany({})`

---

## Quick Delete via Terminal (Backend Running)

If your backend is already running and you're an admin:

**Quick Test:**
```bash
# First, get your token (from browser localStorage or login)
TOKEN="your_token_here"

# Delete all appointments
curl -X DELETE http://localhost:8000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## After Deleting

1. Refresh your appointments page
2. You should see "No appointments scheduled"
3. All "Invalid date" errors should be gone

---

## Notes

- ✅ All appointments will be permanently deleted
- ✅ This action cannot be undone
- ✅ You can book new appointments after deletion
- ⚠️ Make sure you really want to delete all appointments!




