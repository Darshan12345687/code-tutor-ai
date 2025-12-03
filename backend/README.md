# Code Tutor Backend API

Node.js/Express backend with MongoDB for Code Tutor AI application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/codetutor
PORT=8000
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the server:
```bash
npm start
# or for development:
npm run dev
```

## Database Models

- **User**: User accounts with authentication
- **Course**: Learning courses
- **Lesson**: Individual lessons within courses
- **Progress**: User progress tracking
- **CodeSubmission**: Code execution history

## API Routes

All routes are prefixed with `/api`

- `/auth` - Authentication (register, login, me)
- `/users` - User management
- `/courses` - Course CRUD operations
- `/lessons` - Lesson CRUD operations
- `/progress` - Progress tracking
- `/code` - Code execution and explanations
- `/data-structures` - Data structures information

## Authentication

Protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are obtained via `/api/auth/login` or `/api/auth/register`






