# Postman API Examples for CodeTutor

Base URL: `http://localhost:8000`

## Authentication

Most endpoints require authentication. After logging in, you'll receive a `token`. Add it to your requests:

**Header:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## GET Requests (2-3 examples)

### 1. Get All Courses
**GET** `http://localhost:8000/api/courses`

**Headers:**
```
None required (Public endpoint)
```

**Response:**
```json
[
  {
    "_id": "course_id_here",
    "title": "Introduction to Python",
    "description": "Learn Python basics",
    "category": "Programming",
    "difficultyLevel": "beginner",
    "isPublished": true,
    "lessons": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get Course by ID
**GET** `http://localhost:8000/api/courses/:id`

**Example URL:**
```
http://localhost:8000/api/courses/65a1b2c3d4e5f6g7h8i9j0k1
```

**Headers:**
```
None required (Public endpoint)
```

**Response:**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "Introduction to Python",
  "description": "Learn Python basics",
  "category": "Programming",
  "difficultyLevel": "beginner",
  "isPublished": true,
  "lessons": [
    {
      "_id": "lesson_id_here",
      "title": "Variables and Data Types",
      "orderIndex": 1
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Get Current User Profile
**GET** `http://localhost:8000/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "_id": "user_id_here",
  "username": "john.doe",
  "email": "john.doe@semo.edu",
  "fullName": "John Doe",
  "s0Key": "SO1234567",
  "isAdmin": false,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## POST Requests (2-3 examples)

### 1. User Login
**POST** `http://localhost:8000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "john.doe@semo.edu",
  "s0Key": "SO1234567",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "_id": "user_id_here",
  "username": "john.doe",
  "email": "john.doe@semo.edu",
  "fullName": "John Doe",
  "isAdmin": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Save the `token` from this response for authenticated requests!

---

### 2. Create a New Course
**POST** `http://localhost:8000/api/courses`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Advanced JavaScript",
  "description": "Master advanced JavaScript concepts",
  "category": "Web Development",
  "difficultyLevel": "intermediate"
}
```

**Response:**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "Advanced JavaScript",
  "description": "Master advanced JavaScript concepts",
  "category": "Web Development",
  "difficultyLevel": "intermediate",
  "isPublished": false,
  "lessons": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Send a Message
**POST** `http://localhost:8000/api/messages`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "to": "65a1b2c3d4e5f6g7h8i9j0k1",
  "message": "Hello, I need help with the Python course.",
  "subject": "Question about Python Course",
  "type": "question"
}
```

**Response:**
```json
{
  "message": "Message sent successfully",
  "messageData": {
    "_id": "message_id_here",
    "from": {
      "_id": "sender_id",
      "s0Key": "SO1234567",
      "email": "john.doe@semo.edu",
      "fullName": "John Doe",
      "role": "student"
    },
    "to": {
      "_id": "recipient_id",
      "s0Key": "SO7654321",
      "email": "tutor@semo.edu",
      "fullName": "Jane Tutor",
      "role": "tutor"
    },
    "message": "Hello, I need help with the Python course.",
    "subject": "Question about Python Course",
    "type": "question",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## PUT Requests (2-3 examples)

### 1. Update User Profile
**PUT** `http://localhost:8000/api/users/:id`

**Example URL:**
```
http://localhost:8000/api/users/65a1b2c3d4e5f6g7h8i9j0k1
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "fullName": "John Michael Doe",
  "preferredLanguage": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "username": "john.doe",
    "email": "john.doe@semo.edu",
    "fullName": "John Michael Doe",
    "preferredLanguage": "en",
    "s0Key": "SO1234567",
    "isAdmin": false,
    "isActive": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Update Course
**PUT** `http://localhost:8000/api/courses/:id`

**Example URL:**
```
http://localhost:8000/api/courses/65a1b2c3d4e5f6g7h8i9j0k1
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Advanced JavaScript - Updated",
  "description": "Master advanced JavaScript concepts with ES6+",
  "difficultyLevel": "advanced",
  "isPublished": true
}
```

**Response:**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "Advanced JavaScript - Updated",
  "description": "Master advanced JavaScript concepts with ES6+",
  "category": "Web Development",
  "difficultyLevel": "advanced",
  "isPublished": true,
  "lessons": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

---

### 3. Mark Message as Read
**PUT** `http://localhost:8000/api/messages/:id/read`

**Example URL:**
```
http://localhost:8000/api/messages/65a1b2c3d4e5f6g7h8i9j0k1/read
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body:**
```
None required
```

**Response:**
```json
{
  "message": "Message marked as read",
  "messageData": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "from": "sender_id",
    "to": "recipient_id",
    "message": "Hello, I need help with the Python course.",
    "subject": "Question about Python Course",
    "isRead": true,
    "readAt": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Quick Setup Tips for Postman

1. **Create an Environment:**
   - Create a new environment in Postman
   - Add variable: `base_url` = `http://localhost:8000`
   - Add variable: `token` = (leave empty, will be set after login)

2. **Set Authorization Token:**
   - After login, copy the `token` from response
   - Go to Collection Settings → Authorization
   - Type: Bearer Token
   - Token: `{{token}}`

3. **Or use Headers:**
   - Add Header: `Authorization` = `Bearer {{token}}`

4. **Test Authentication:**
   - First, run the Login POST request
   - Use Postman's Tests tab to automatically save token:
   ```javascript
   if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       pm.environment.set("token", jsonData.token);
   }
   ```

---

## Common Status Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

---

## Notes

- All email addresses must end with `@semo.edu`
- S0 Keys must be in format: `SO1234567` or `S01234567`
- Replace `YOUR_TOKEN_HERE` and `:id` placeholders with actual values
- Make sure the backend server is running on port 8000
- Most POST/PUT requests require authentication via Bearer token




