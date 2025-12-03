# SEMO Code Tutor - Branding Guide

## Brand Colors

### Primary Colors
- **SEMO Red**: `#C8102E`
- **SEMO Dark Red**: `#8B1538`

### Usage
- Primary buttons and CTAs: SEMO Red gradient
- Headers and navigation: SEMO Red to Dark Red gradient
- Accents and highlights: SEMO Red

## Logo
- Location: `/public/semo-codetutor-logo.svg`
- Used in: Header, authentication pages, loading states

## Typography
- Primary Font: System fonts (San Francisco, Segoe UI, etc.)
- Code Font: 'Courier New', 'Monaco', 'Consolas', monospace

## Features Implemented

### 1. Multi-Language Support
- Python 🐍
- Java ☕
- C ⚙️
- C++ ⚡
- C# 🎯
- JavaScript 📜

### 2. User-Specific Progress Tracking
- Each user's progress is stored separately in MongoDB
- Tracks:
  - Code execution history
  - Time spent per lesson
  - Concepts mastered
  - Preferred programming language
  - Learning history

### 3. Interactive Terminal
- Real-time code execution
- Command history
- Multi-language support
- Auto-saves to user history

### 4. Database Schema Updates

#### User Model
- `preferredLanguage`: User's preferred programming language
- `learningHistory`: Array of completed lessons with scores and time spent

#### Progress Model
- `language`: Language used for this progress entry
- `codeHistory`: Array of code executions with output/errors
- `totalTimeSpent`: Cumulative time spent

## API Endpoints

### Progress Tracking
- `GET /api/progress/me` - Get user's progress
- `GET /api/progress/stats` - Get user statistics
- `POST /api/progress/save-code` - Save code execution to history
- `PUT /api/progress/:id` - Update progress

### User Preferences
- `PUT /api/users/preferences` - Update preferred language

## Next Steps
1. Add more SEMO-specific imagery
2. Customize error messages with SEMO branding
3. Add SEMO-themed loading animations
4. Create SEMO-specific course content






