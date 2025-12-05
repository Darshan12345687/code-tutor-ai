# Code Tutor AI

An AI-powered code tutoring platform that helps students learn programming through interactive code execution, intelligent explanations, and comprehensive learning resources.

## 🎯 Features

### Core Features
- **Interactive Code Editor**: Write and execute Python code in real-time
- **Sandbox Code Execution**: Secure Docker-based code execution with resource limits
- **AI-Powered Explanations**: Multi-provider AI integration (Mistral, Gemini, OpenAI, HuggingFace) with intelligent fallback
- **Code Error Detection**: Automatic error detection and beginner-friendly explanations
- **Interactive Terminal**: WebSocket-based terminal for real-time code interaction
- **Voice Features**: Text-to-speech and speech-to-text for accessible learning
- **Progress Tracking**: Detailed analytics and learning insights
- **Data Structures Learning**: Comprehensive tutorials on 8+ data structures with visualizations
- **Role-Based Access Control**: Student, Premium, Instructor, and Admin roles with granular permissions
- **Security**: Rate limiting, input sanitization, XSS protection, and secure authentication

### Learning Features
- **Quizzes**: Interactive quizzes with multiple choice questions
- **Flashcards**: Spaced repetition algorithm for effective learning
- **Appointments**: Schedule tutoring sessions with instructors
- **Messaging**: Direct communication between tutors and students
- **Analytics Dashboard**: Track progress, completion rates, and learning patterns

## 🛠️ Tech Stack

### Backend
- **Node.js** (v16+): JavaScript runtime
- **Express.js**: Web framework with WebSocket support
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: Secure authentication tokens
- **bcryptjs**: Password hashing
- **Docker**: Sandboxed code execution
- **WebSocket**: Real-time terminal interaction

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **CSS3**: Modern styling with gradients and animations

### AI Integration
- **Mistral AI**: Primary AI provider
- **Google Gemini**: Secondary AI provider (free tier)
- **OpenAI GPT-4**: Advanced code analysis
- **Hugging Face**: Free-tier fallback provider

## 📋 Prerequisites

- Node.js 16 or higher
- MongoDB (local or cloud instance)
- Docker (for sandboxed code execution)
- npm or yarn
- Git

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Darshan12345687/code-tutor-ai.git
cd code-tutor-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/codetutor

# Server
PORT=8000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d

# AI API Keys (at least one required)
MISTRAL_API_KEY=your-mistral-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
OPENAI_API_KEY=your-openai-api-key (optional)
HUGGING_FACE_API_KEY=your-hugging-face-key (optional)

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

Or use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`.

### 5. Start Docker

Ensure Docker is running for code execution:

```bash
# Check Docker status
docker ps
```

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Frontend will start on `http://localhost:3000`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder using a static server
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Code Execution
- `POST /api/code/execute` - Execute code in sandbox (Public, rate limited)
- `POST /api/code/execute-save` - Execute and save submission (Protected)
- `GET /api/code/submissions` - Get user's code submissions (Protected)

### AI Features
- `POST /api/ai/explain` - AI-powered code explanation (Protected)
- `POST /api/ai/generate-course` - Generate course content (Protected, instructor/admin)
- `POST /api/ai/feedback` - Get AI feedback on code (Protected)

### Data Structures
- `GET /api/data-structures` - Get all data structures
- `GET /api/data-structures/:id` - Get data structure details

### Progress & Analytics
- `GET /api/progress` - Get user's progress (Protected)
- `GET /api/analytics/user-progress` - Get user progress analytics (Protected)

For complete API documentation, see the API collection or test endpoints using Postman.

## 📁 Project Structure

```
code-tutor-ai/
├── backend/
│   ├── config/          # Configuration files
│   ├── middleware/      # Auth, RBAC, security middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/         # Business logic (AI, sandbox, etc.)
│   ├── scripts/          # Utility scripts
│   └── server.js         # Express server entry point
├── frontend/
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── App.tsx       # Main app component
│       └── index.tsx     # Entry point
└── README.md
```

## 🔒 Security Features

- JWT-based authentication with token expiration
- Role-based access control (RBAC)
- Rate limiting on all endpoints
- Input sanitization and XSS protection
- MongoDB injection protection
- Docker sandboxing for code execution
- Resource limits (CPU, memory)
- Network isolation for code execution
- API key protection middleware

## 🎓 User Roles

- **Student**: Basic access, code execution, view courses
- **Premium Student**: All student features + AI explanations, voice features
- **Instructor**: All premium features + create/edit courses and lessons
- **Admin**: Full system access, user management

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Code Execution Test
```bash
# Test code execution endpoint
curl -X POST http://localhost:8000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "language": "python"}'
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify network connectivity for cloud MongoDB

### Docker Issues
- Ensure Docker is running: `docker ps`
- Check Docker permissions
- Verify Docker daemon is accessible

### AI Provider Issues
- Verify API keys are correct in `.env`
- Check API quotas and rate limits
- System will automatically fallback to available providers

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `REACT_APP_API_URL` in frontend `.env` accordingly

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

CS Student Development Team

## 🙏 Acknowledgments

- Mistral AI, Google Gemini, OpenAI, and Hugging Face for AI services
- MongoDB for database services
- React and Express.js communities for excellent documentation

## 📞 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ for learning programming**

