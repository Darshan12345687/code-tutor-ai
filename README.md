# Code Tutor AI - Full Stack Application

A comprehensive AI-powered code tutoring application that helps users learn programming through interactive code execution, AI-generated explanations, and detailed data structures tutorials.

## Features

### 🎯 Core Features
- **Interactive Code Editor**: Write and execute Python code in real-time
- **Sandbox Code Execution**: Secure Docker-based code execution with resource limits
- **Interactive Terminal**: WebSocket-based terminal for real-time code interaction
- **AI-Powered Explanations**: OpenAI GPT-4 and Google Gemini integration for intelligent code explanations
- **Voice Features**: Text-to-speech and speech-to-text for accessible learning
- **Role-Based Access Control**: Student, Premium, Instructor, and Admin roles with granular permissions
- **Progress Tracking**: Detailed analytics and learning insights
- **Data Structures Learning**: Comprehensive tutorials on 8+ data structures with visualizations
- **Security**: Rate limiting, input sanitization, XSS protection, and secure authentication
- **Modern UI**: Beautiful, responsive design with gradient themes

### 📚 Data Structures Covered
- Lists
- Dictionaries
- Sets
- Tuples
- Stacks
- Queues
- Linked Lists
- Binary Trees

Each data structure includes:
- Detailed descriptions
- Characteristics and properties
- Common operations
- Time complexity analysis
- Complete code examples

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework with WebSocket support
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: Secure authentication tokens
- **bcryptjs**: Password hashing
- **Mistral AI**: Primary AI provider (configured with API key)
- **Google Gemini**: Secondary AI provider (configured with API key)
- **OpenAI API**: Optional GPT-4 for code explanations
- **Hugging Face**: Optional free AI models
- **Docker**: Sandboxed code execution
- **WebSocket**: Real-time terminal interaction
- **Helmet**: Security headers
- **Rate Limiting**: API protection

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **CSS3**: Modern styling with gradients and animations

## Project Structure

```
CODE(codetutor)/
├── backend/
│   ├── server.js            # Express server
│   ├── package.json        # Node.js dependencies
│   ├── models/              # MongoDB models (User, Course, Lesson, etc.)
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   └── utils/               # Utility functions
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── OutputPanel.tsx
│   │   │   ├── ExplanationPanel.tsx
│   │   │   ├── DataStructuresPanel.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   └── index.css
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 16 or higher
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/codetutor
JWT_SECRET=your-secret-key-here

# AI API Keys (Get your keys from respective providers)
MISTRAL_API_KEY=your-mistral-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# Optional AI Providers
OPENAI_API_KEY=your-openai-api-key (optional)
HUGGING_FACE_API_KEY=your-hugging-face-key (optional)
```

> **Note**: Mistral AI and Google Gemini API keys are already configured. The system uses automatic fallback between multiple AI providers.

5. Make sure MongoDB is running on your system

6. Run the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will start on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## API Endpoints

> See [FEATURES.md](FEATURES.md) for complete API documentation

### Authentication
- **POST** `/api/auth/register` - Register a new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/me` - Get current user (Protected)

### Users
- **GET** `/api/users` - Get all users (Admin only)
- **GET** `/api/users/:id` - Get user by ID
- **PUT** `/api/users/:id` - Update user

### Courses
- **GET** `/api/courses` - Get all published courses
- **GET** `/api/courses/:id` - Get course by ID with lessons
- **POST** `/api/courses` - Create course (Protected)
- **PUT** `/api/courses/:id` - Update course (Protected)
- **DELETE** `/api/courses/:id` - Delete course (Protected)

### Lessons
- **GET** `/api/lessons` - Get all lessons (optionally filtered by courseId)
- **GET** `/api/lessons/:id` - Get lesson by ID
- **POST** `/api/lessons` - Create lesson (Protected)
- **PUT** `/api/lessons/:id` - Update lesson (Protected)
- **DELETE** `/api/lessons/:id` - Delete lesson (Protected)

### Progress
- **GET** `/api/progress` - Get user's progress (Protected)
- **GET** `/api/progress/:lessonId` - Get progress for specific lesson (Protected)
- **POST** `/api/progress` - Create or update progress (Protected)
- **PUT** `/api/progress/:id` - Update progress (Protected)

### Code Execution
- **POST** `/api/code/execute` - Execute code in sandbox (Public, rate limited)
- **POST** `/api/code/execute-save` - Execute and save submission (Protected)
- **POST** `/api/code/explain` - Get code explanation (Legacy, use `/api/ai/explain`)
- **GET** `/api/code/submissions` - Get user's code submissions (Protected)

### AI Features
- **POST** `/api/ai/explain` - AI-powered code explanation (Protected, requires AI permission)
- **POST** `/api/ai/generate-course` - Generate course content (Protected, instructor/admin)
- **POST** `/api/ai/feedback` - Get AI feedback on code (Protected)

### Voice Features
- **POST** `/api/voice/text-to-speech` - Convert text to speech (Protected)
- **POST** `/api/voice/speech-to-text` - Convert speech to text (Protected)
- **POST** `/api/voice/explain-code` - Voice explanation for code (Protected)

### Terminal
- **POST** `/api/terminal/create` - Create interactive terminal session (Protected)
- **WS** `/api/terminal/:sessionId` - WebSocket terminal connection
- **DELETE** `/api/terminal/:sessionId` - Close terminal session

### Analytics
- **GET** `/api/analytics/user-progress` - Get user progress analytics (Protected)
- **GET** `/api/analytics/course/:courseId` - Get course analytics (Protected)

### Data Structures
- **GET** `/api/data-structures` - Get all data structures
- **GET** `/api/data-structures/:id` - Get data structure details

## Usage

1. **Code Editor Tab**:
   - Write Python code in the editor
   - Click "Run Code" to execute and see output
   - Click "Explain Code" to get AI-powered explanations

2. **Data Structures Tab**:
   - Browse available data structures
   - Click on any data structure to view detailed information
   - Study characteristics, operations, time complexity, and code examples

## Features in Detail

### Code Execution
- Safe code execution with timeout protection (10 seconds)
- Real-time output display
- Comprehensive error handling
- Execution time tracking

### AI Explanations
- Automatic concept detection (Lists, Dictionaries, Sets, Tuples, OOP, Functions, Loops, Conditionals)
- Detailed explanations of code functionality
- Related examples and code snippets
- Concept tags for easy understanding

### Data Structures Learning
- Interactive card-based navigation
- Detailed explanations with examples
- Time complexity analysis
- Complete working code examples
- Visual organization of information

## Development

### Backend Development
The backend uses FastAPI with automatic API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Development
The frontend uses React with TypeScript. Hot reload is enabled during development.

## Security Notes

- Code execution is sandboxed with timeout protection
- Currently supports Python only
- For production, consider additional security measures:
  - Docker containerization for code execution
  - Resource limits (CPU, memory)
  - Network restrictions
  - Input validation and sanitization

## Key Features Implemented

✅ **AI Integration with Intelligent Fallback & CodeTutor-AI Training**
- **Mistral AI** (Primary) - Pre-configured, trained with CodeTutor-AI prompt
- **Google Gemini** (Secondary) - Pre-configured, trained with CodeTutor-AI prompt
- **OpenAI GPT-4** (Tertiary) - User-provided key, trained with CodeTutor-AI prompt
- **Hugging Face** (Quaternary) - Free tier available, trained with CodeTutor-AI prompt
- **CodeTutor-AI System Prompt** - All providers trained as programming-only teaching assistant
- **Automatic fallback** - Seamlessly switches between providers
- **Health checking** - Skips known-bad providers
- **Retry logic** - Handles temporary failures
- **Graceful degradation** - Always returns a result
- **Question validation** - Automatically refuses non-programming questions
- AI-powered course generation
- Intelligent code feedback
- Beginner-friendly explanations

✅ **Security & Authentication**
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting on all endpoints
- Input sanitization and XSS protection
- MongoDB injection protection

✅ **Code Execution**
- Docker-based sandboxing
- Resource limits (CPU, Memory)
- Network isolation
- Interactive terminal via WebSocket

✅ **Voice Features**
- Text-to-speech (OpenAI TTS, Google TTS)
- Speech-to-text (OpenAI Whisper, Google STT)
- Voice code explanations

✅ **Progress Tracking**
- Detailed user analytics
- Course-wise progress
- Code submission statistics
- Concepts mastered tracking

## Future Enhancements

- [ ] Frontend visual components for data structures
- [ ] Algorithm visualization animations
- [ ] Support for multiple programming languages (JavaScript, Java, C++)
- [ ] Code challenge exercises with auto-grading
- [ ] Collaborative coding features
- [ ] Mobile app support
- [ ] Offline mode support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ❤️ for learning programming**

